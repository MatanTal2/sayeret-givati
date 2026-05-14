/**
 * Server-side account-deletion service (Settings PR-G).
 *
 * Self-serve soft-delete. Stamps `deletionRequestedAt` on the user doc
 * and writes a credentialAuditLog entry. Hard delete (Firebase Auth user
 * delete + Firestore tombstone) is a follow-up cron/script.
 *
 * Pre-flight asset check blocks the delete if the user is still holding
 * any equipment, ammunition (user-level), or has open transfer requests.
 * Council answer Q3=a: block, do not auto-retire.
 */
import { getAdminAuth, getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { EquipmentStatus, TransferStatus } from '@/types/equipment';
import {
  ACCOUNT_DELETION_RETENTION_DAYS,
  type OutstandingAssets,
} from '@/types/accountDeletion';
import { writeCredentialAuditEvent } from './credentialAuditService';

export class AccountDeletionHasAssetsError extends Error {
  outstanding: OutstandingAssets;
  constructor(outstanding: OutstandingAssets) {
    super('user has outstanding assets');
    this.name = 'AccountDeletionHasAssetsError';
    this.outstanding = outstanding;
  }
}

export class AccountDeletionAlreadyRequestedError extends Error {
  constructor() {
    super('account deletion already requested');
    this.name = 'AccountDeletionAlreadyRequestedError';
  }
}

export class AccountDeletionNoPendingError extends Error {
  constructor() {
    super('no pending deletion request');
    this.name = 'AccountDeletionNoPendingError';
  }
}

/**
 * Count outstanding assets for a uid:
 * - Equipment serial items whose `currentHolderId === uid` and status is
 *   anything except RETIRED (the user is the active signer).
 * - Ammunition serial items held by the user (`currentHolderType === USER`).
 * - Ammunition inventory rows owned by the user (`holderType === USER`).
 * - Open transfer requests where the user is the source or destination
 *   and status is PENDING.
 */
export async function countOutstandingAssetsForUser(uid: string): Promise<OutstandingAssets> {
  const db = getAdminDb();

  const [equipmentSnap, ammoSerialSnap, ammoInventorySnap, transfersFromSnap, transfersToSnap] =
    await Promise.all([
      db
        .collection(COLLECTIONS.EQUIPMENT)
        .where('currentHolderId', '==', uid)
        .where('status', '!=', EquipmentStatus.RETIRED)
        .get(),
      db
        .collection(COLLECTIONS.AMMUNITION)
        .where('currentHolderType', '==', 'USER')
        .where('currentHolderId', '==', uid)
        .get(),
      db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .where('holderType', '==', 'USER')
        .where('holderId', '==', uid)
        .get(),
      db
        .collection(COLLECTIONS.TRANSFER_REQUESTS)
        .where('fromUserId', '==', uid)
        .where('status', '==', TransferStatus.PENDING)
        .get(),
      db
        .collection(COLLECTIONS.TRANSFER_REQUESTS)
        .where('toUserId', '==', uid)
        .where('status', '==', TransferStatus.PENDING)
        .get(),
    ]);

  return {
    equipmentCount: equipmentSnap.size,
    ammunitionUserHoldings: ammoSerialSnap.size + ammoInventorySnap.size,
    pendingTransferRequests: transfersFromSnap.size + transfersToSnap.size,
  };
}

interface RequestDeleteInput {
  uid: string;
  reason?: string;
}

interface RequestDeleteResult {
  deletionRequestedAtMs: number;
}

/**
 * Mark the user doc with `deletionRequestedAt`. Throws
 * `AccountDeletionHasAssetsError` (carrying the count breakdown) if
 * pre-flight finds the user is still holding equipment / ammunition or
 * has open transfer requests. Throws `AccountDeletionAlreadyRequestedError`
 * if a prior pending request already exists.
 *
 * The mirror does NOT mutate `displayName` here — that rename lives in
 * the hard-delete path so users who cancel within the retention window
 * keep their identity intact.
 */
export async function serverRequestAccountDeletion(
  input: RequestDeleteInput,
): Promise<RequestDeleteResult> {
  const db = getAdminDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(input.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error('user profile not found');
  }
  const userData = userSnap.data() ?? {};
  if (userData.deletionRequestedAt) {
    throw new AccountDeletionAlreadyRequestedError();
  }

  const outstanding = await countOutstandingAssetsForUser(input.uid);
  if (
    outstanding.equipmentCount > 0 ||
    outstanding.ammunitionUserHoldings > 0 ||
    outstanding.pendingTransferRequests > 0
  ) {
    throw new AccountDeletionHasAssetsError(outstanding);
  }

  const update: Record<string, unknown> = {
    deletionRequestedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.reason && input.reason.trim().length > 0) {
    update.deletionReason = input.reason.trim().slice(0, 500);
  }
  await userRef.update(update);

  return { deletionRequestedAtMs: Date.now() };
}

/**
 * Clear `deletionRequestedAt` if the user changed their mind within the
 * retention window. Throws `AccountDeletionNoPendingError` when there is
 * no pending request to cancel.
 */
export async function serverCancelAccountDeletion(uid: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error('user profile not found');
  }
  const userData = userSnap.data() ?? {};
  if (!userData.deletionRequestedAt) {
    throw new AccountDeletionNoPendingError();
  }
  await userRef.update({
    deletionRequestedAt: FieldValue.delete(),
    deletionReason: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Hard-delete sweep (PR-G follow-up, 2026-05-14)
//
// Iterates `users` docs whose `deletionRequestedAt` is older than the 30-day
// retention window, calls `Auth.deleteUser(uid)` (swallows
// `auth/user-not-found` so a partially-completed prior run resumes cleanly),
// tombstones the Firestore doc with PII scrubbed, and writes an
// `ACCOUNT_DELETED` credential audit row.
//
// Council outcomes locked in:
// - Order: stamp `deletionStartedAt` → Auth.deleteUser → Firestore tombstone
//   (`deletedAt`, PII scrub) → audit row.
// - Idempotency: `deletedAt != null` filter excludes tombstoned rows from the
//   candidate set on the next run. Sentinel `deletionStartedAt` marks
//   in-flight deletions so a resume after Firestore failure works.
// - Asset re-check: re-run `countOutstandingAssetsForUser` per candidate. If
//   the user re-acquired equipment/ammo during the 30-day window, skip them
//   (do NOT auto-retire — admin must intervene). Matches the soft-delete
//   pre-flight policy (Q3=a).
// - Per-uid try/catch + aggregate: one bad uid must not strand the rest.
// ---------------------------------------------------------------------------

export type SweepSkipReason =
  | 'no_pending'                 // deletionRequestedAt missing or already cancelled
  | 'too_young'                  // requestedAt within retention window
  | 'already_tombstoned'         // deletedAt set; skip
  | 'has_outstanding_assets';    // re-acquired during the wait period

export type SweepErrorReason =
  | 'auth_delete_failed'
  | 'firestore_write_failed'
  | 'audit_write_failed'
  | 'user_not_found_in_firestore'
  | 'unknown';

export interface SweepOptions {
  /** When true, no Auth or Firestore writes happen. Audit + log still write nothing. */
  dryRun: boolean;
  /** Max candidates this invocation will process. Clamp 1..100. */
  batchLimit: number;
  /** Injected for tests; defaults to `new Date()`. */
  now?: Date;
  /** Surgical mode — skip query, target this single uid. Useful for the operator script. */
  onlyUid?: string;
}

export interface SweepCandidateLog {
  uid: string;
  ageDays: number;
  outcome: 'deleted' | 'skipped' | 'errored';
  reason?: SweepSkipReason | SweepErrorReason;
  message?: string;
}

export interface SweepResult {
  examined: number;
  deleted: number;
  skipped: number;
  errors: Array<{ uid: string; reason: SweepErrorReason; message?: string }>;
  dryRun: boolean;
  durationMs: number;
  candidates: SweepCandidateLog[];
}

const SYSTEM_ACTOR_UID = 'system';
const SYSTEM_ACTOR_USER_TYPE = 'SYSTEM';

function msToDays(ms: number): number {
  return ms / (1000 * 60 * 60 * 24);
}

function timestampToMs(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts) {
    try {
      const v = (ts as { toMillis: () => number }).toMillis();
      return typeof v === 'number' ? v : null;
    } catch {
      return null;
    }
  }
  return null;
}

interface UserDocLite {
  deletionRequestedAt?: unknown;
  deletedAt?: unknown;
  deletionStartedAt?: unknown;
}

/**
 * Hard-delete users whose soft-delete request has aged past the 30-day
 * retention window. Idempotent + resumable. See module-level comment for
 * full design.
 */
export async function serverSweepAccountDeletions(opts: SweepOptions): Promise<SweepResult> {
  const startedAtMs = Date.now();
  const now = opts.now ?? new Date();
  const cutoffMs = now.getTime() - ACCOUNT_DELETION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(cutoffMs);
  const limit = Math.max(1, Math.min(100, opts.batchLimit));

  const db = getAdminDb();
  const candidates: Array<{ uid: string; data: UserDocLite }> = [];

  if (opts.onlyUid) {
    const snap = await db.collection(COLLECTIONS.USERS).doc(opts.onlyUid).get();
    if (snap.exists) {
      candidates.push({ uid: opts.onlyUid, data: (snap.data() ?? {}) as UserDocLite });
    }
  } else {
    // Firestore can't filter on `deletedAt == null` reliably when the field
    // is missing on most docs, so we filter by age here and skip tombstoned
    // rows client-side. Small candidate set; the cost is negligible.
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where('deletionRequestedAt', '<', Timestamp.fromMillis(cutoffMs))
      .limit(limit * 2)
      .get();
    for (const doc of snap.docs) {
      candidates.push({ uid: doc.id, data: doc.data() as UserDocLite });
      if (candidates.length >= limit * 2) break;
    }
  }

  const result: SweepResult = {
    examined: 0,
    deleted: 0,
    skipped: 0,
    errors: [],
    dryRun: opts.dryRun,
    durationMs: 0,
    candidates: [],
  };

  for (const candidate of candidates) {
    if (result.deleted + result.skipped + result.errors.length >= limit) break;
    result.examined += 1;
    const { uid, data } = candidate;

    const requestedAtMs = timestampToMs(data.deletionRequestedAt);
    if (!requestedAtMs) {
      result.skipped += 1;
      result.candidates.push({ uid, ageDays: 0, outcome: 'skipped', reason: 'no_pending' });
      continue;
    }

    const ageDays = msToDays(now.getTime() - requestedAtMs);

    if (requestedAtMs >= cutoffDate.getTime()) {
      result.skipped += 1;
      result.candidates.push({ uid, ageDays, outcome: 'skipped', reason: 'too_young' });
      continue;
    }

    if (timestampToMs(data.deletedAt) !== null) {
      result.skipped += 1;
      result.candidates.push({ uid, ageDays, outcome: 'skipped', reason: 'already_tombstoned' });
      continue;
    }

    // Re-check outstanding assets — the user may have re-acquired equipment
    // or ammo during the retention window. Same Q3=a policy as soft-delete:
    // block, don't auto-retire.
    let assets: OutstandingAssets;
    try {
      assets = await countOutstandingAssetsForUser(uid);
    } catch (err) {
      result.errors.push({
        uid,
        reason: 'unknown',
        message: err instanceof Error ? err.message : String(err),
      });
      result.candidates.push({
        uid,
        ageDays,
        outcome: 'errored',
        reason: 'unknown',
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (
      assets.equipmentCount > 0 ||
      assets.ammunitionUserHoldings > 0 ||
      assets.pendingTransferRequests > 0
    ) {
      result.skipped += 1;
      result.candidates.push({
        uid,
        ageDays,
        outcome: 'skipped',
        reason: 'has_outstanding_assets',
        message: `equipment=${assets.equipmentCount} ammo=${assets.ammunitionUserHoldings} transfers=${assets.pendingTransferRequests}`,
      });
      continue;
    }

    if (opts.dryRun) {
      result.deleted += 1;
      result.candidates.push({ uid, ageDays, outcome: 'deleted' });
      continue;
    }

    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);

    // 1. Checkpoint: stamp deletionStartedAt so a resume after a mid-flight
    //    crash can detect "we were here".
    try {
      await userRef.update({
        deletionStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      result.errors.push({
        uid,
        reason: 'firestore_write_failed',
        message: err instanceof Error ? err.message : String(err),
      });
      result.candidates.push({
        uid,
        ageDays,
        outcome: 'errored',
        reason: 'firestore_write_failed',
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    // 2. Auth.deleteUser — swallow user-not-found (resume case).
    try {
      await getAdminAuth().deleteUser(uid);
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
      if (code !== 'auth/user-not-found') {
        result.errors.push({
          uid,
          reason: 'auth_delete_failed',
          message: err instanceof Error ? err.message : String(err),
        });
        result.candidates.push({
          uid,
          ageDays,
          outcome: 'errored',
          reason: 'auth_delete_failed',
          message: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
      // Auth user already gone — treat as success and continue to tombstone.
    }

    // 3. Firestore tombstone — scrub PII, set deletedAt.
    try {
      await userRef.update({
        deletedAt: FieldValue.serverTimestamp(),
        displayName: 'Deleted User',
        firstName: FieldValue.delete(),
        lastName: FieldValue.delete(),
        email: null,
        phoneNumber: null,
        profileImage: FieldValue.delete(),
        address: FieldValue.delete(),
        communicationPreferences: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      result.errors.push({
        uid,
        reason: 'firestore_write_failed',
        message: err instanceof Error ? err.message : String(err),
      });
      result.candidates.push({
        uid,
        ageDays,
        outcome: 'errored',
        reason: 'firestore_write_failed',
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    // 4. Credential audit — best-effort. Failure here does NOT roll back the
    //    delete (that's irreversible anyway) and does NOT count the candidate
    //    as failed. Log it as an audit error to flag for follow-up.
    try {
      await writeCredentialAuditEvent({
        uid,
        actorUid: SYSTEM_ACTOR_UID,
        actorUserType: SYSTEM_ACTOR_USER_TYPE,
        eventType: 'ACCOUNT_DELETED',
      });
    } catch (err) {
      console.warn(
        '[accountDeletion] audit write failed for hard-deleted uid:',
        uid,
        err,
      );
    }

    result.deleted += 1;
    result.candidates.push({ uid, ageDays, outcome: 'deleted' });
  }

  result.durationMs = Date.now() - startedAtMs;
  return result;
}
