/**
 * Server-side Retirement Request Service (firebase-admin).
 * Mirrors transferRequestService: request creation happens via
 * serverRetireEquipment; this module covers approve + reject by the holder.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateNotification } from './notificationService';
import {
  ActionType,
  EquipmentStatus,
  RetirementRequestStatus,
} from '@/types/equipment';

interface ApproveRetirementInput {
  requestId: string;
  approverUserId: string; // Must match request.holderUserId
  approverUserName: string;
  note?: string;
}

export async function serverApproveRetirementRequest(
  input: ApproveRetirementInput
): Promise<void> {
  const db = getAdminDb();
  const requestRef = db.collection(COLLECTIONS.RETIREMENT_REQUESTS).doc(input.requestId);

  await db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) throw new Error('Retirement request not found');
    const req = reqDoc.data()!;

    if (req.status !== RetirementRequestStatus.PENDING) {
      throw new Error('Retirement request is not pending');
    }
    if (req.holderUserId !== input.approverUserId) {
      throw new Error('Only the current holder may approve this retirement');
    }

    const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(req.equipmentDocId);
    const eqDoc = await transaction.get(equipmentRef);
    if (!eqDoc.exists) throw new Error('Equipment not found');
    const equipment = eqDoc.data()!;

    const now = Timestamp.now();
    transaction.update(requestRef, {
      status: RetirementRequestStatus.APPROVED,
      statusHistory: [
        ...(req.statusHistory || []),
        {
          status: RetirementRequestStatus.APPROVED,
          timestamp: now,
          updatedBy: input.approverUserId,
          updatedByName: input.approverUserName,
          ...(input.note ? { note: input.note } : {}),
        },
      ],
    });

    const historyEntry = {
      action: 'equipment_retired',
      holder: equipment.currentHolder,
      location: equipment.location,
      notes: `Retirement approved by ${input.approverUserName}${input.note ? ': ' + input.note : ''}`,
      timestamp: now,
      updatedBy: input.approverUserId,
    };

    transaction.update(equipmentRef, {
      status: EquipmentStatus.RETIRED,
      trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Post-transaction side effects
  try {
    const req = (await requestRef.get()).data()!;
    await serverCreateActionLog({
      actionType: ActionType.RETIREMENT_APPROVED,
      equipmentId: req.equipmentId,
      equipmentDocId: req.equipmentDocId,
      equipmentName: req.equipmentName,
      actorId: input.approverUserId,
      actorName: input.approverUserName,
      targetId: req.signerUserId,
      targetName: req.signerUserName,
      ...(input.note ? { note: input.note } : {}),
    });

    await serverCreateNotification({
      userId: req.signerUserId,
      type: 'retirement_approved',
      title: 'בקשת החזרה לצבא אושרה',
      message: `${input.approverUserName} אישר את החזרת ${req.equipmentName} לצבא`,
      relatedEquipmentId: req.equipmentId,
      relatedEquipmentDocId: req.equipmentDocId,
      equipmentName: req.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-approve side effects failed:', e);
  }
}

interface RejectRetirementInput {
  requestId: string;
  rejectorUserId: string; // Must match request.holderUserId
  rejectorUserName: string;
  reason?: string;
}

export async function serverRejectRetirementRequest(
  input: RejectRetirementInput
): Promise<void> {
  const db = getAdminDb();
  const requestRef = db.collection(COLLECTIONS.RETIREMENT_REQUESTS).doc(input.requestId);

  await db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) throw new Error('Retirement request not found');
    const req = reqDoc.data()!;

    if (req.status !== RetirementRequestStatus.PENDING) {
      throw new Error('Retirement request is not pending');
    }
    if (req.holderUserId !== input.rejectorUserId) {
      throw new Error('Only the current holder may reject this retirement');
    }

    const now = Timestamp.now();
    transaction.update(requestRef, {
      status: RetirementRequestStatus.REJECTED,
      statusHistory: [
        ...(req.statusHistory || []),
        {
          status: RetirementRequestStatus.REJECTED,
          timestamp: now,
          updatedBy: input.rejectorUserId,
          updatedByName: input.rejectorUserName,
          ...(input.reason ? { note: input.reason } : {}),
        },
      ],
    });
  });

  try {
    const req = (await requestRef.get()).data()!;
    await serverCreateActionLog({
      actionType: ActionType.RETIREMENT_REJECTED,
      equipmentId: req.equipmentId,
      equipmentDocId: req.equipmentDocId,
      equipmentName: req.equipmentName,
      actorId: input.rejectorUserId,
      actorName: input.rejectorUserName,
      targetId: req.signerUserId,
      targetName: req.signerUserName,
      ...(input.reason ? { note: input.reason } : {}),
    });

    await serverCreateNotification({
      userId: req.signerUserId,
      type: 'retirement_rejected',
      title: 'בקשת החזרה לצבא נדחתה',
      message: `${input.rejectorUserName} דחה את בקשת החזרת ${req.equipmentName}${input.reason ? ': ' + input.reason : ''}`,
      relatedEquipmentId: req.equipmentId,
      relatedEquipmentDocId: req.equipmentDocId,
      equipmentName: req.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-reject side effects failed:', e);
  }
}
