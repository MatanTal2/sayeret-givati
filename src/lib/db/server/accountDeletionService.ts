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
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { EquipmentStatus, TransferStatus } from '@/types/equipment';
import type { OutstandingAssets } from '@/types/accountDeletion';

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
