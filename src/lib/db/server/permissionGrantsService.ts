/**
 * Server-side Permission Grants Service (firebase-admin).
 *
 * Persists, lists, and lifecycles `permissionGrants/{grantId}` documents.
 * Issuance is gated to ADMIN + SYSTEM_MANAGER (never TL); duration is capped
 * at MAX_GRANT_DURATION_MS (7 days). The loader `getActiveGrants` is consumed
 * by `auth.getActorFromRequest` to elevate role classifiers per active grant.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { UserType } from '@/types/user';
import {
  GrantStatus,
  MAX_GRANT_DURATION_MS,
  type ActiveGrant,
  type GrantScope,
  type PermissionGrant,
} from '@/types/permissionGrant';
import { serverCreateNotification } from './notificationService';
import { NotificationType } from '@/types/notifications';

const ALLOWED_ROLES: ReadonlySet<UserType> = new Set([
  UserType.TEAM_LEADER,
  UserType.MANAGER,
  UserType.SYSTEM_MANAGER,
]);

const ISSUER_ROLES: ReadonlySet<UserType> = new Set([
  UserType.ADMIN,
  UserType.SYSTEM_MANAGER,
]);

export class GrantValidationError extends Error {
  constructor(message: string, public readonly status: 400 | 403 = 400) {
    super(message);
    this.name = 'GrantValidationError';
  }
}

export function isGrantIssuer(userType: UserType): boolean {
  return ISSUER_ROLES.has(userType);
}

/**
 * Active, non-expired grants for a single user. Filtered server-side; expired
 * grants are ignored even if their status is still 'active' (status is only
 * flipped to 'revoked' explicitly — expiry is computed at read time).
 */
export async function getActiveGrants(uid: string): Promise<ActiveGrant[]> {
  if (!uid) return [];
  const db = getAdminDb();
  const now = Date.now();
  const snap = await db
    .collection(COLLECTIONS.PERMISSION_GRANTS)
    .where('userId', '==', uid)
    .where('status', '==', GrantStatus.ACTIVE)
    .where('expiresAtMs', '>', now)
    .get();

  const grants: ActiveGrant[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Partial<PermissionGrant>;
    if (!data.grantedRole || !data.scope || typeof data.expiresAtMs !== 'number') continue;
    grants.push({
      id: doc.id,
      grantedRole: data.grantedRole,
      scope: data.scope,
      ...(data.scopeTeamId ? { scopeTeamId: data.scopeTeamId } : {}),
      expiresAtMs: data.expiresAtMs,
    });
  }
  return grants;
}

export interface IssueGrantInput {
  userId: string;
  userDisplayName?: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  expiresAtMs: number;
  reason: string;
  issuerUid: string;
  issuerUserType: UserType;
  issuerDisplayName?: string;
}

export interface IssueGrantResult {
  id: string;
}

export async function serverIssueGrant(input: IssueGrantInput): Promise<IssueGrantResult> {
  if (!isGrantIssuer(input.issuerUserType)) {
    throw new GrantValidationError(
      'Forbidden: only admin or system manager may issue grants',
      403
    );
  }

  if (!input.userId || typeof input.userId !== 'string') {
    throw new GrantValidationError('userId is required');
  }
  if (input.userId === input.issuerUid) {
    throw new GrantValidationError('Issuers cannot grant a role to themselves');
  }
  if (!ALLOWED_ROLES.has(input.grantedRole)) {
    throw new GrantValidationError(
      `grantedRole must be one of: ${[...ALLOWED_ROLES].join(', ')}`
    );
  }
  if (input.scope !== 'all' && input.scope !== 'team') {
    throw new GrantValidationError("scope must be 'all' or 'team'");
  }
  if (input.scope === 'team' && !input.scopeTeamId) {
    throw new GrantValidationError("scopeTeamId is required when scope === 'team'");
  }
  if (input.scope === 'all' && input.issuerUserType !== UserType.ADMIN) {
    throw new GrantValidationError(
      "Only admin may issue scope='all' grants",
      403
    );
  }
  const reason = (input.reason ?? '').trim();
  if (!reason) {
    throw new GrantValidationError('reason is required');
  }

  const now = Date.now();
  if (typeof input.expiresAtMs !== 'number' || !Number.isFinite(input.expiresAtMs)) {
    throw new GrantValidationError('expiresAtMs must be a finite number');
  }
  if (input.expiresAtMs <= now) {
    throw new GrantValidationError('expiresAtMs must be in the future');
  }
  if (input.expiresAtMs - now > MAX_GRANT_DURATION_MS) {
    throw new GrantValidationError('Grant duration exceeds the 7-day cap');
  }

  const db = getAdminDb();

  // Reject overlapping active grants for the same user+role+scope (idempotent UX).
  const overlapQuery = await db
    .collection(COLLECTIONS.PERMISSION_GRANTS)
    .where('userId', '==', input.userId)
    .where('status', '==', GrantStatus.ACTIVE)
    .where('grantedRole', '==', input.grantedRole)
    .where('expiresAtMs', '>', now)
    .get();
  const overlap = overlapQuery.docs.find((d) => {
    const data = d.data() as Partial<PermissionGrant>;
    if (data.scope !== input.scope) return false;
    if (input.scope === 'team') return data.scopeTeamId === input.scopeTeamId;
    return true;
  });
  if (overlap) {
    throw new GrantValidationError(
      'An active grant with the same role and scope already exists for this user'
    );
  }

  const ref = db.collection(COLLECTIONS.PERMISSION_GRANTS).doc();
  const data: Record<string, unknown> = {
    userId: input.userId,
    ...(input.userDisplayName ? { userDisplayName: input.userDisplayName } : {}),
    grantedRole: input.grantedRole,
    scope: input.scope,
    ...(input.scope === 'team' && input.scopeTeamId
      ? { scopeTeamId: input.scopeTeamId }
      : {}),
    issuedBy: input.issuerUid,
    ...(input.issuerDisplayName ? { issuedByDisplayName: input.issuerDisplayName } : {}),
    issuedAtMs: now,
    expiresAtMs: input.expiresAtMs,
    reason,
    status: GrantStatus.ACTIVE,
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(data);

  // Notify the grantee. Failure here must not roll back the grant.
  try {
    await serverCreateNotification({
      userId: input.userId,
      type: NotificationType.SYSTEM_MESSAGE,
      title: 'הענקת תפקיד זמני',
      message: buildIssueNotificationMessage(input),
    });
  } catch (e) {
    console.error('[permissionGrants] issue notification failed', e);
  }

  return { id: ref.id };
}

function buildIssueNotificationMessage(input: IssueGrantInput): string {
  const roleLabel = roleLabelHebrew(input.grantedRole);
  const scopeLabel =
    input.scope === 'all' ? 'כלל הצוותים' : `צוות ${input.scopeTeamId}`;
  const expires = new Date(input.expiresAtMs).toLocaleString('he-IL');
  return `קיבלת הענקת תפקיד זמנית: ${roleLabel} (${scopeLabel}) עד ${expires}.`;
}

function roleLabelHebrew(role: UserType): string {
  switch (role) {
    case UserType.ADMIN:
      return 'מנהל';
    case UserType.SYSTEM_MANAGER:
      return 'מנהל מערכת';
    case UserType.MANAGER:
      return 'מנהל';
    case UserType.TEAM_LEADER:
      return 'מפקד צוות';
    default:
      return role;
  }
}

export interface RevokeGrantInput {
  grantId: string;
  actorUid: string;
  actorUserType: UserType;
  actorDisplayName?: string;
  reason?: string;
}

export async function serverRevokeGrant(input: RevokeGrantInput): Promise<void> {
  if (!isGrantIssuer(input.actorUserType)) {
    throw new GrantValidationError(
      'Forbidden: only admin or system manager may revoke grants',
      403
    );
  }
  if (!input.grantId) {
    throw new GrantValidationError('grantId is required');
  }
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.PERMISSION_GRANTS).doc(input.grantId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new GrantValidationError('Grant not found', 400);
  }
  const data = snap.data() as Partial<PermissionGrant>;
  if (data.status !== GrantStatus.ACTIVE) {
    throw new GrantValidationError('Grant is not active');
  }
  await ref.update({
    status: GrantStatus.REVOKED,
    revokedBy: input.actorUid,
    ...(input.actorDisplayName ? { revokedByDisplayName: input.actorDisplayName } : {}),
    revokedAtMs: Date.now(),
    ...(input.reason && input.reason.trim() ? { revokeReason: input.reason.trim() } : {}),
  });
}

export interface ListGrantsFilter {
  userId?: string;
  status?: GrantStatus;
  includeExpired?: boolean;
}

export interface PermissionGrantView extends PermissionGrant {
  isExpired: boolean;
}

/**
 * Admin list endpoint backing for the Permission Grants tab.
 * Returns up to 200 most-recent grants matching the filter, newest first.
 */
export async function serverListGrants(
  filter: ListGrantsFilter = {}
): Promise<PermissionGrantView[]> {
  const db = getAdminDb();
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.PERMISSION_GRANTS)
    .orderBy('issuedAtMs', 'desc')
    .limit(200);
  if (filter.userId) {
    query = query.where('userId', '==', filter.userId);
  }
  if (filter.status) {
    query = query.where('status', '==', filter.status);
  }
  const snap = await query.get();
  const now = Date.now();
  const out: PermissionGrantView[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Partial<PermissionGrant>;
    if (
      !data.userId ||
      !data.grantedRole ||
      !data.scope ||
      typeof data.issuedAtMs !== 'number' ||
      typeof data.expiresAtMs !== 'number' ||
      !data.status
    ) {
      continue;
    }
    const view: PermissionGrantView = {
      id: doc.id,
      userId: data.userId,
      userDisplayName: data.userDisplayName,
      grantedRole: data.grantedRole,
      scope: data.scope,
      scopeTeamId: data.scopeTeamId,
      issuedBy: data.issuedBy ?? '',
      issuedByDisplayName: data.issuedByDisplayName,
      issuedAtMs: data.issuedAtMs,
      expiresAtMs: data.expiresAtMs,
      reason: data.reason ?? '',
      status: data.status,
      revokedBy: data.revokedBy,
      revokedByDisplayName: data.revokedByDisplayName,
      revokedAtMs: data.revokedAtMs,
      revokeReason: data.revokeReason,
      isExpired: data.expiresAtMs <= now,
    };
    if (!filter.includeExpired && view.isExpired && view.status === GrantStatus.ACTIVE) {
      // Active+expired: skip when caller asked for active only
      if (filter.status === GrantStatus.ACTIVE) continue;
    }
    out.push(view);
  }
  return out;
}
