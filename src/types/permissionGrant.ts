import { UserType } from '@/types/user';

export enum GrantStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

export type GrantScope = 'all' | 'team';

/**
 * In-memory shape consumed by policy helpers. expiresAt is epoch milliseconds
 * to keep the type usable on both client and server without firebase-admin /
 * firebase Timestamp version mismatch.
 */
export interface ActiveGrant {
  id: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  expiresAtMs: number;
}

/**
 * Firestore document shape for permissionGrants/{grantId}.
 * Audit fields (issuedBy/issuedAtMs/revokedBy/revokedAtMs) live on the doc
 * itself — there is no actionsLog entry for grant lifecycle (actionsLog is
 * equipment-coupled).
 */
export interface PermissionGrant {
  id: string;
  userId: string;
  userDisplayName?: string;
  grantedRole: UserType;
  scope: GrantScope;
  scopeTeamId?: string;
  issuedBy: string;
  issuedByDisplayName?: string;
  issuedAtMs: number;
  expiresAtMs: number;
  reason: string;
  status: GrantStatus;
  revokedBy?: string;
  revokedByDisplayName?: string;
  revokedAtMs?: number;
  revokeReason?: string;
}

/**
 * Maximum grant duration in milliseconds. Enforced server-side at issuance.
 */
export const MAX_GRANT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
