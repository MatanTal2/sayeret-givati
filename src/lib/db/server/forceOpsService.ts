/**
 * Server-side Force Operations Service (firebase-admin) — manager/admin bypass.
 * Can change holder, signer, or both on one or more equipment items atomically.
 * When holder/signer change, the denormalized team/unit fields MUST be updated
 * from the target user's profile in the same transaction.
 *
 * Not exposed to the client as a generic lib; only reachable via /api/force-ops.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp, type DocumentData, type UpdateData } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateBatchNotifications } from './notificationService';
import { ActionType } from '@/types/equipment';

export type ForceOpKind = 'holder' | 'signer' | 'both';

interface ForceOpsInput {
  equipmentDocIds: string[];
  kind: ForceOpKind;
  targetUserId: string; // New holder and/or new signer
  actorUserId: string; // The privileged user executing the op
  actorUserName: string;
  reason: string; // Required, written to every action log
}

interface DisplacedParty {
  userId: string;
  role: 'holder' | 'signer';
  equipmentDocId: string;
  equipmentName: string;
}

export async function serverForceOps(
  input: ForceOpsInput
): Promise<{ updatedDocIds: string[] }> {
  if (!input.equipmentDocIds.length) {
    throw new Error('equipmentDocIds must not be empty');
  }
  if (!input.reason) {
    throw new Error('reason is required for force operations');
  }

  const db = getAdminDb();

  // Pre-fetch target user profile (outside transaction — profile doesn't change mid-op).
  const targetSnap = await db.collection(COLLECTIONS.USERS).doc(input.targetUserId).get();
  if (!targetSnap.exists) throw new Error('Target user not found');
  const targetProfile = targetSnap.data()!;
  const targetName =
    `${targetProfile.firstName || ''} ${targetProfile.lastName || ''}`.trim() ||
    targetProfile.displayName ||
    input.targetUserId;
  const targetTeamId = targetProfile.teamId ?? null;

  const displaced: DisplacedParty[] = [];
  const updatedDocIds: string[] = [];

  await db.runTransaction(async (transaction) => {
    const refs = input.equipmentDocIds.map((id) =>
      db.collection(COLLECTIONS.EQUIPMENT).doc(id)
    );
    const snaps = await Promise.all(refs.map((r) => transaction.get(r)));

    snaps.forEach((snap, idx) => {
      if (!snap.exists) {
        throw new Error(`Equipment ${input.equipmentDocIds[idx]} not found`);
      }
      const eq = snap.data()!;
      const now = Timestamp.now();
      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (input.kind === 'holder' || input.kind === 'both') {
        if (eq.currentHolderId && eq.currentHolderId !== input.targetUserId) {
          displaced.push({
            userId: eq.currentHolderId,
            role: 'holder',
            equipmentDocId: input.equipmentDocIds[idx],
            equipmentName: eq.productName,
          });
        }
        updates.currentHolderId = input.targetUserId;
        updates.currentHolder = targetName;
        updates.holderTeamId = targetTeamId;
      }
      if (input.kind === 'signer' || input.kind === 'both') {
        if (eq.signedById && eq.signedById !== input.targetUserId) {
          displaced.push({
            userId: eq.signedById,
            role: 'signer',
            equipmentDocId: input.equipmentDocIds[idx],
            equipmentName: eq.productName,
          });
        }
        updates.signedById = input.targetUserId;
        updates.signedBy = targetName;
        updates.signerTeamId = targetTeamId;
      }

      const historyEntry = {
        action:
          input.kind === 'signer'
            ? 'force_transfer_signer'
            : input.kind === 'holder'
            ? 'force_transfer_holder'
            : 'force_transfer_both',
        holder: (updates.currentHolder as string | undefined) ?? eq.currentHolder,
        location: eq.location,
        notes: `Force-${input.kind} by ${input.actorUserName}: ${input.reason}`,
        timestamp: now,
        updatedBy: input.actorUserId,
      };

      updates.trackingHistory = [...(eq.trackingHistory || []), historyEntry];
      transaction.update(refs[idx], updates as UpdateData<DocumentData>);
      updatedDocIds.push(input.equipmentDocIds[idx]);
    });
  });

  // Post-transaction: N action logs (one per item changed) + notifications to displaced parties.
  try {
    await Promise.all(
      updatedDocIds.map(async (docId) => {
        const eqSnap = await db.collection(COLLECTIONS.EQUIPMENT).doc(docId).get();
        const eq = eqSnap.data()!;
        const actionType =
          input.kind === 'signer'
            ? ActionType.FORCE_TRANSFER_SIGNER
            : ActionType.FORCE_TRANSFER_HOLDER;
        return serverCreateActionLog({
          actionType,
          equipmentId: eq.id || docId,
          equipmentDocId: docId,
          equipmentName: eq.productName,
          actorId: input.actorUserId,
          actorName: input.actorUserName,
          targetId: input.targetUserId,
          targetName,
          note: input.reason,
        });
      })
    );

    if (displaced.length > 0) {
      await serverCreateBatchNotifications(
        displaced.map((d) => ({
          userId: d.userId,
          type:
            d.role === 'holder'
              ? 'force_transfer_executed'
              : 'force_signer_changed',
          title:
            d.role === 'holder'
              ? 'ציוד הועבר מרשותך'
              : 'אחריות חתימה על ציוד הוסבה',
          message: `${input.actorUserName} ביצע העברה כפויה של ${d.equipmentName}: ${input.reason}`,
          relatedEquipmentDocId: d.equipmentDocId,
          equipmentName: d.equipmentName,
        }))
      );
    }
  } catch (e) {
    console.error('[Server] Force-ops side effects failed:', e);
  }

  return { updatedDocIds };
}
