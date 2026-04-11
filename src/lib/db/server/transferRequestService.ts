/**
 * Server-side Transfer Request Service (firebase-admin)
 * Handles transactional writes across transferRequests + equipment collections.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateNotification, serverCreateBatchNotifications } from './notificationService';

interface CreateTransferInput {
  equipmentDocId: string;
  toUserId: string;
  toUserName: string;
  reason: string;
  fromUserId: string;
  fromUserName: string;
  note?: string;
  trackingHistoryEntry: Record<string, unknown>;
  currentTrackingHistory: Record<string, unknown>[];
}

export async function serverCreateTransferRequest(input: CreateTransferInput): Promise<string> {
  const db = getAdminDb();

  const resultId = await db.runTransaction(async (transaction) => {
    // Verify equipment exists
    const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentDocId);
    const equipmentDoc = await transaction.get(equipmentRef);

    if (!equipmentDoc.exists) {
      throw new Error('Equipment not found');
    }

    const equipment = equipmentDoc.data()!;

    // Create transfer request
    const now = new Date();
    const transferRequestRef = db.collection(COLLECTIONS.TRANSFER_REQUESTS).doc();

    const transferRequestData = {
      equipmentId: equipment.id || input.equipmentDocId,
      equipmentDocId: input.equipmentDocId,
      equipmentName: equipment.productName,
      fromUserId: input.fromUserId,
      fromUserName: input.fromUserName,
      toUserId: input.toUserId,
      toUserName: input.toUserName,
      reason: input.reason,
      ...(input.note ? { note: input.note } : {}),
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: now,
        updatedBy: input.fromUserId,
        updatedByName: input.fromUserName,
        note: 'Transfer request created'
      }],
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(transferRequestRef, transferRequestData);

    // Update equipment status to pending transfer
    const updatedHistory = [...input.currentTrackingHistory, input.trackingHistoryEntry];
    transaction.update(equipmentRef, {
      status: 'pending_transfer',
      trackingHistory: updatedHistory,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return transferRequestRef.id;
  });

  // Create notification for the recipient (non-critical, after transaction)
  try {
    const db2 = getAdminDb();
    const eqDoc = await db2.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentDocId).get();
    const equipmentName = eqDoc.data()?.productName || input.equipmentDocId;

    await serverCreateNotification({
      userId: input.toUserId,
      type: 'transfer_request',
      title: 'בקשת העברת ציוד',
      message: `${input.fromUserName} מבקש להעביר אליך: ${equipmentName}`,
      relatedEquipmentId: input.equipmentDocId,
      relatedEquipmentDocId: input.equipmentDocId,
      relatedTransferId: resultId,
      equipmentName,
    });
  } catch (e) {
    console.error('[Server] Failed to create transfer request notification:', e);
  }

  return resultId;
}

interface ApproveTransferInput {
  transferRequestId: string;
  approverUserId: string;
  approverUserName: string;
  approvalNote?: string;
}

export async function serverApproveTransferRequest(input: ApproveTransferInput): Promise<void> {
  const db = getAdminDb();

  await db.runTransaction(async (transaction) => {
    const transferRef = db.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId);
    const transferDoc = await transaction.get(transferRef);

    if (!transferDoc.exists) throw new Error('Transfer request not found');

    const transferRequest = transferDoc.data()!;
    if (transferRequest.status !== 'pending') throw new Error('Transfer request is not pending');

    const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(transferRequest.equipmentDocId);
    const equipmentDoc = await transaction.get(equipmentRef);
    if (!equipmentDoc.exists) throw new Error('Equipment not found');

    const equipment = equipmentDoc.data()!;
    const now = new Date();

    // Update transfer request
    const newStatusEntry = {
      status: 'approved',
      timestamp: now,
      updatedBy: input.approverUserId,
      updatedByName: input.approverUserName,
      ...(input.approvalNote ? { note: input.approvalNote } : {}),
    };

    transaction.update(transferRef, {
      status: 'approved',
      statusHistory: [...(transferRequest.statusHistory || []), newStatusEntry],
    });

    // Update equipment — transfer to new holder
    const transferHistoryEntry = {
      action: 'transfer_completed',
      holder: transferRequest.toUserName,
      location: equipment.location,
      notes: `Transfer approved by ${input.approverUserName}`,
      timestamp: now,
      updatedBy: input.approverUserId,
    };

    transaction.update(equipmentRef, {
      currentHolder: transferRequest.toUserName,
      currentHolderId: transferRequest.toUserId,
      status: 'available',
      trackingHistory: [...(equipment.trackingHistory || []), transferHistoryEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Action log outside transaction (non-critical)
  try {
    const db2 = getAdminDb();
    const transferDoc = await db2.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId).get();
    const tr = transferDoc.data()!;
    await serverCreateActionLog({
      actionType: 'transfer_approved',
      equipmentId: tr.equipmentId,
      equipmentDocId: tr.equipmentDocId,
      equipmentName: tr.equipmentName,
      actorId: input.approverUserId,
      actorName: input.approverUserName,
      targetId: tr.toUserId,
      targetName: tr.toUserName,
    });
  } catch (e) {
    console.error('[Server] Failed to create action log for transfer approval:', e);
  }

  // Send notifications (non-critical)
  try {
    const db3 = getAdminDb();
    const trDoc = await db3.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId).get();
    const tr = trDoc.data()!;

    // Notify requester that transfer was approved
    await serverCreateNotification({
      userId: tr.fromUserId,
      type: 'transfer_approved',
      title: 'בקשת העברה אושרה',
      message: `${input.approverUserName} אישר את בקשת ההעברה של ${tr.equipmentName}`,
      relatedEquipmentId: tr.equipmentId,
      relatedEquipmentDocId: tr.equipmentDocId,
      relatedTransferId: input.transferRequestId,
      equipmentName: tr.equipmentName,
    });

    // Notify both parties that transfer is completed
    await serverCreateBatchNotifications([
      {
        userId: tr.fromUserId,
        type: 'transfer_completed',
        title: 'העברת ציוד הושלמה',
        message: `העברת ${tr.equipmentName} הושלמה בהצלחה`,
        relatedEquipmentId: tr.equipmentId,
        relatedEquipmentDocId: tr.equipmentDocId,
        relatedTransferId: input.transferRequestId,
        equipmentName: tr.equipmentName,
      },
      {
        userId: tr.toUserId,
        type: 'transfer_completed',
        title: 'העברת ציוד הושלמה',
        message: `העברת ${tr.equipmentName} הושלמה בהצלחה`,
        relatedEquipmentId: tr.equipmentId,
        relatedEquipmentDocId: tr.equipmentDocId,
        relatedTransferId: input.transferRequestId,
        equipmentName: tr.equipmentName,
      },
    ]);
  } catch (e) {
    console.error('[Server] Failed to send transfer approval notifications:', e);
  }
}

interface RejectTransferInput {
  transferRequestId: string;
  rejectorUserId: string;
  rejectorUserName: string;
  rejectionReason?: string;
}

export async function serverRejectTransferRequest(input: RejectTransferInput): Promise<void> {
  const db = getAdminDb();

  await db.runTransaction(async (transaction) => {
    const transferRef = db.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId);
    const transferDoc = await transaction.get(transferRef);

    if (!transferDoc.exists) throw new Error('Transfer request not found');

    const transferRequest = transferDoc.data()!;
    if (transferRequest.status !== 'pending') throw new Error('Transfer request is not pending');

    const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(transferRequest.equipmentDocId);
    const equipmentDoc = await transaction.get(equipmentRef);
    if (!equipmentDoc.exists) throw new Error('Equipment not found');

    const equipment = equipmentDoc.data()!;
    const now = new Date();

    // Update transfer request
    const newStatusEntry = {
      status: 'rejected',
      timestamp: now,
      updatedBy: input.rejectorUserId,
      updatedByName: input.rejectorUserName,
      ...(input.rejectionReason ? { note: input.rejectionReason } : {}),
    };

    transaction.update(transferRef, {
      status: 'rejected',
      statusHistory: [...(transferRequest.statusHistory || []), newStatusEntry],
    });

    // Revert equipment to available
    const rejectHistoryEntry = {
      action: 'transfer_rejected',
      holder: equipment.currentHolder,
      location: equipment.location,
      notes: `Transfer rejected by ${input.rejectorUserName}${input.rejectionReason ? ': ' + input.rejectionReason : ''}`,
      timestamp: now,
      updatedBy: input.rejectorUserId,
    };

    transaction.update(equipmentRef, {
      status: 'available',
      trackingHistory: [...(equipment.trackingHistory || []), rejectHistoryEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Action log outside transaction (non-critical)
  try {
    const db2 = getAdminDb();
    const transferDoc = await db2.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId).get();
    const tr = transferDoc.data()!;
    await serverCreateActionLog({
      actionType: 'transfer_rejected',
      equipmentId: tr.equipmentId,
      equipmentDocId: tr.equipmentDocId,
      equipmentName: tr.equipmentName,
      actorId: input.rejectorUserId,
      actorName: input.rejectorUserName,
      targetId: tr.fromUserId,
      targetName: tr.fromUserName,
      ...(input.rejectionReason ? { note: input.rejectionReason } : {}),
    });
  } catch (e) {
    console.error('[Server] Failed to create action log for transfer rejection:', e);
  }

  // Send rejection notification (non-critical)
  try {
    const db3 = getAdminDb();
    const trDoc = await db3.collection(COLLECTIONS.TRANSFER_REQUESTS).doc(input.transferRequestId).get();
    const tr = trDoc.data()!;

    await serverCreateNotification({
      userId: tr.fromUserId,
      type: 'transfer_rejected',
      title: 'בקשת העברה נדחתה',
      message: `${input.rejectorUserName} דחה את בקשת ההעברה של ${tr.equipmentName}${input.rejectionReason ? ': ' + input.rejectionReason : ''}`,
      relatedEquipmentId: tr.equipmentId,
      relatedEquipmentDocId: tr.equipmentDocId,
      relatedTransferId: input.transferRequestId,
      equipmentName: tr.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Failed to send transfer rejection notification:', e);
  }
}
