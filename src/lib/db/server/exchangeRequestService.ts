/**
 * Server-side Exchange Request Service (firebase-admin).
 *
 * Models the broken-item swap flow:
 *   - Holder marks an item broken → serverRequestExchange writes a pending
 *     ExchangeRequest and flips the item to EXCHANGE_REQUESTED.
 *   - Signer approves with a new serial → serverApproveExchangeRequest atomically
 *     retires the old doc (status=RETIRED + successorDocId) and creates a new doc
 *     at equipment/{newSerial} (predecessorDocId points back).
 *   - Signer rejects → serverRejectExchangeRequest flips item back to AVAILABLE.
 *   - Signer-direct path (no prior request) → serverReplaceByAnother performs the
 *     same atomic retire+create and records an approved ExchangeRequest.
 *
 * Permission shape mirrors retirementRequestService.ts: the role embedded on the
 * equipment doc (currentHolderId / signedById) is the source of truth, not the
 * actor's userType.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateNotification } from './notificationService';
import {
  ActionType,
  EquipmentStatus,
  EquipmentCondition,
  ExchangeRequestStatus,
} from '@/types/equipment';
import { NotificationType } from '@/types/notifications';

// ---------------------------------------------------------------------------
// Request — holder marks item broken
// ---------------------------------------------------------------------------

interface RequestExchangeInput {
  equipmentDocId: string;
  actorId: string;     // Must equal equipment.currentHolderId
  actorName: string;
  reason: string;
}

export async function serverRequestExchange(
  input: RequestExchangeInput
): Promise<{ requestId: string }> {
  if (!input.reason || !input.reason.trim()) {
    throw new Error('Reason is required');
  }

  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentDocId);

  const result = await db.runTransaction(async (transaction) => {
    const eqDoc = await transaction.get(equipmentRef);
    if (!eqDoc.exists) throw new Error('Equipment not found');
    const equipment = eqDoc.data()!;

    if (equipment.currentHolderId !== input.actorId) {
      throw new Error('Only the current holder may request an exchange');
    }
    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new Error('Equipment must be AVAILABLE to request an exchange');
    }

    const now = Timestamp.now();
    const requestRef = db.collection(COLLECTIONS.EXCHANGE_REQUESTS).doc();
    transaction.set(requestRef, {
      equipmentId: equipment.id || input.equipmentDocId,
      equipmentDocId: input.equipmentDocId,
      equipmentName: equipment.productName,
      holderUserId: input.actorId,
      holderUserName: input.actorName,
      signerUserId: equipment.signedById,
      signerUserName: equipment.signedBy,
      reason: input.reason,
      status: ExchangeRequestStatus.PENDING,
      statusHistory: [
        {
          status: ExchangeRequestStatus.PENDING,
          timestamp: now,
          updatedBy: input.actorId,
          updatedByName: input.actorName,
          note: 'Exchange request created',
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
    });

    const historyEntry = {
      action: 'exchange_requested',
      holder: equipment.currentHolder,
      location: equipment.location,
      notes: `Exchange requested by ${input.actorName}: ${input.reason}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.update(equipmentRef, {
      status: EquipmentStatus.EXCHANGE_REQUESTED,
      trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { requestId: requestRef.id, signerUserId: equipment.signedById, signerUserName: equipment.signedBy, equipmentName: equipment.productName, equipmentId: equipment.id || input.equipmentDocId };
  });

  try {
    await serverCreateActionLog({
      actionType: ActionType.EXCHANGE_REQUESTED,
      equipmentId: result.equipmentId,
      equipmentDocId: input.equipmentDocId,
      equipmentName: result.equipmentName,
      actorId: input.actorId,
      actorName: input.actorName,
      targetId: result.signerUserId,
      targetName: result.signerUserName,
      note: input.reason,
    });

    await serverCreateNotification({
      userId: result.signerUserId,
      type: NotificationType.EXCHANGE_REQUEST_APPROVAL,
      title: 'בקשת החלפת ציוד',
      message: `${input.actorName} מבקש להחליף את ${result.equipmentName}: ${input.reason}`,
      relatedEquipmentId: result.equipmentId,
      relatedEquipmentDocId: input.equipmentDocId,
      equipmentName: result.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-exchange-request side effects failed:', e);
  }

  return { requestId: result.requestId };
}

// ---------------------------------------------------------------------------
// Approve — signer assigns new serial
// ---------------------------------------------------------------------------

interface ApproveExchangeInput {
  requestId: string;
  actorId: string;     // Must equal equipment.signedById
  actorName: string;
  newSerialNumber: string;
  note?: string;
}

export async function serverApproveExchangeRequest(
  input: ApproveExchangeInput
): Promise<{ newEquipmentDocId: string }> {
  if (!input.newSerialNumber || !input.newSerialNumber.trim()) {
    throw new Error('New serial number is required');
  }

  const db = getAdminDb();
  const requestRef = db.collection(COLLECTIONS.EXCHANGE_REQUESTS).doc(input.requestId);

  const newEquipmentDocId = input.newSerialNumber.trim();

  const result = await db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) throw new Error('Exchange request not found');
    const req = reqDoc.data()!;

    if (req.status !== ExchangeRequestStatus.PENDING) {
      throw new Error('Exchange request is not pending');
    }
    if (req.signerUserId !== input.actorId) {
      throw new Error('Only the signer may approve this exchange');
    }

    const oldRef = db.collection(COLLECTIONS.EQUIPMENT).doc(req.equipmentDocId);
    const oldDoc = await transaction.get(oldRef);
    if (!oldDoc.exists) throw new Error('Old equipment not found');
    const old = oldDoc.data()!;

    if (old.status !== EquipmentStatus.EXCHANGE_REQUESTED) {
      throw new Error('Old equipment is not in EXCHANGE_REQUESTED state');
    }

    const newRef = db.collection(COLLECTIONS.EQUIPMENT).doc(newEquipmentDocId);
    const newDocSnap = await transaction.get(newRef);
    if (newDocSnap.exists) {
      throw new Error('Equipment with this serial number already exists');
    }

    const now = Timestamp.now();

    // 1. Retire old doc with successor link.
    const oldHistoryEntry = {
      action: 'exchange_completed',
      holder: old.currentHolder,
      location: old.location,
      notes: `Replaced by serial ${newEquipmentDocId}${input.note ? ': ' + input.note : ''}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.update(oldRef, {
      status: EquipmentStatus.RETIRED,
      successorDocId: newEquipmentDocId,
      trackingHistory: [...(old.trackingHistory || []), oldHistoryEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create new doc.
    const newHistoryEntry = {
      action: 'equipment_created',
      holder: old.currentHolder,
      location: old.location,
      notes: `Created via exchange from serial ${old.id || req.equipmentDocId}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.set(newRef, {
      id: newEquipmentDocId,
      equipmentType: old.equipmentType,
      productName: old.productName,
      category: old.category,
      ...(old.subcategory ? { subcategory: old.subcategory } : {}),
      ...(old.model ? { model: old.model } : {}),
      ...(old.manufacturer ? { manufacturer: old.manufacturer } : {}),
      acquisitionDate: now,
      dateSigned: now,
      lastSeen: now,
      lastReportUpdate: now,
      signedBy: old.signedBy,
      signedById: old.signedById,
      currentHolder: old.currentHolder,
      currentHolderId: old.currentHolderId,
      ...(old.holderTeamId ? { holderTeamId: old.holderTeamId } : {}),
      ...(old.signerTeamId ? { signerTeamId: old.signerTeamId } : {}),
      status: EquipmentStatus.AVAILABLE,
      location: old.location,
      condition: EquipmentCondition.GOOD,
      ...(old.catalogNumber ? { catalogNumber: old.catalogNumber } : {}),
      ...(old.requiresDailyStatusCheck !== undefined ? { requiresDailyStatusCheck: old.requiresDailyStatusCheck } : {}),
      ...(old.hasSerialNumber !== undefined ? { hasSerialNumber: old.hasSerialNumber } : {}),
      predecessorDocId: req.equipmentDocId,
      trackingHistory: [newHistoryEntry],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Update request.
    transaction.update(requestRef, {
      status: ExchangeRequestStatus.APPROVED,
      newEquipmentDocId,
      newSerialNumber: newEquipmentDocId,
      statusHistory: [
        ...(req.statusHistory || []),
        {
          status: ExchangeRequestStatus.APPROVED,
          timestamp: now,
          updatedBy: input.actorId,
          updatedByName: input.actorName,
          ...(input.note ? { note: input.note } : {}),
        },
      ],
    });

    return {
      newEquipmentDocId,
      oldEquipmentId: old.id || req.equipmentDocId,
      oldEquipmentDocId: req.equipmentDocId,
      equipmentName: old.productName,
      holderUserId: old.currentHolderId,
      holderUserName: old.currentHolder,
    };
  });

  try {
    await serverCreateActionLog({
      actionType: ActionType.EXCHANGE_APPROVED,
      equipmentId: result.oldEquipmentId,
      equipmentDocId: result.oldEquipmentDocId,
      equipmentName: result.equipmentName,
      actorId: input.actorId,
      actorName: input.actorName,
      targetId: result.holderUserId,
      targetName: result.holderUserName,
      note: `New serial: ${result.newEquipmentDocId}${input.note ? ' — ' + input.note : ''}`,
    });

    await serverCreateActionLog({
      actionType: ActionType.EXCHANGE_COMPLETED,
      equipmentId: result.newEquipmentDocId,
      equipmentDocId: result.newEquipmentDocId,
      equipmentName: result.equipmentName,
      actorId: input.actorId,
      actorName: input.actorName,
      targetId: result.holderUserId,
      targetName: result.holderUserName,
      note: `Replaces serial ${result.oldEquipmentId}`,
    });

    await serverCreateNotification({
      userId: result.holderUserId,
      type: NotificationType.EXCHANGE_APPROVED,
      title: 'בקשת החלפה אושרה',
      message: `${input.actorName} אישר את ההחלפה. מספר סידורי חדש: ${result.newEquipmentDocId}`,
      relatedEquipmentId: result.newEquipmentDocId,
      relatedEquipmentDocId: result.newEquipmentDocId,
      equipmentName: result.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-approve-exchange side effects failed:', e);
  }

  return { newEquipmentDocId: result.newEquipmentDocId };
}

// ---------------------------------------------------------------------------
// Reject — signer denies the exchange
// ---------------------------------------------------------------------------

interface RejectExchangeInput {
  requestId: string;
  actorId: string;
  actorName: string;
  reason?: string;
}

export async function serverRejectExchangeRequest(
  input: RejectExchangeInput
): Promise<void> {
  const db = getAdminDb();
  const requestRef = db.collection(COLLECTIONS.EXCHANGE_REQUESTS).doc(input.requestId);

  const result = await db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) throw new Error('Exchange request not found');
    const req = reqDoc.data()!;

    if (req.status !== ExchangeRequestStatus.PENDING) {
      throw new Error('Exchange request is not pending');
    }
    if (req.signerUserId !== input.actorId) {
      throw new Error('Only the signer may reject this exchange');
    }

    const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(req.equipmentDocId);
    const eqDoc = await transaction.get(equipmentRef);
    if (!eqDoc.exists) throw new Error('Equipment not found');
    const equipment = eqDoc.data()!;

    const now = Timestamp.now();
    transaction.update(requestRef, {
      status: ExchangeRequestStatus.REJECTED,
      statusHistory: [
        ...(req.statusHistory || []),
        {
          status: ExchangeRequestStatus.REJECTED,
          timestamp: now,
          updatedBy: input.actorId,
          updatedByName: input.actorName,
          ...(input.reason ? { note: input.reason } : {}),
        },
      ],
    });

    // Revert equipment back to AVAILABLE only if it's still in EXCHANGE_REQUESTED.
    if (equipment.status === EquipmentStatus.EXCHANGE_REQUESTED) {
      const historyEntry = {
        action: 'exchange_rejected',
        holder: equipment.currentHolder,
        location: equipment.location,
        notes: `Exchange rejected by ${input.actorName}${input.reason ? ': ' + input.reason : ''}`,
        timestamp: now,
        updatedBy: input.actorId,
      };
      transaction.update(equipmentRef, {
        status: EquipmentStatus.AVAILABLE,
        trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      equipmentId: equipment.id || req.equipmentDocId,
      equipmentDocId: req.equipmentDocId,
      equipmentName: equipment.productName,
      holderUserId: req.holderUserId,
      holderUserName: req.holderUserName,
    };
  });

  try {
    await serverCreateActionLog({
      actionType: ActionType.EXCHANGE_REJECTED,
      equipmentId: result.equipmentId,
      equipmentDocId: result.equipmentDocId,
      equipmentName: result.equipmentName,
      actorId: input.actorId,
      actorName: input.actorName,
      targetId: result.holderUserId,
      targetName: result.holderUserName,
      ...(input.reason ? { note: input.reason } : {}),
    });

    await serverCreateNotification({
      userId: result.holderUserId,
      type: NotificationType.EXCHANGE_REJECTED,
      title: 'בקשת החלפה נדחתה',
      message: `${input.actorName} דחה את בקשת ההחלפה${input.reason ? ': ' + input.reason : ''}`,
      relatedEquipmentId: result.equipmentId,
      relatedEquipmentDocId: result.equipmentDocId,
      equipmentName: result.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-reject-exchange side effects failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Replace-by-another — signer-direct path (no prior request)
// ---------------------------------------------------------------------------

interface ReplaceByAnotherInput {
  equipmentDocId: string;
  actorId: string;      // Must equal equipment.signedById
  actorName: string;
  newSerialNumber: string;
  reason?: string;
}

export async function serverReplaceByAnother(
  input: ReplaceByAnotherInput
): Promise<{ newEquipmentDocId: string; requestId: string }> {
  if (!input.newSerialNumber || !input.newSerialNumber.trim()) {
    throw new Error('New serial number is required');
  }

  const db = getAdminDb();
  const newEquipmentDocId = input.newSerialNumber.trim();

  const result = await db.runTransaction(async (transaction) => {
    const oldRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentDocId);
    const oldDoc = await transaction.get(oldRef);
    if (!oldDoc.exists) throw new Error('Equipment not found');
    const old = oldDoc.data()!;

    if (old.signedById !== input.actorId) {
      throw new Error('Only the signer may perform a direct replacement');
    }
    // Allow direct replace from AVAILABLE; EXCHANGE_REQUESTED items go through approve/reject.
    if (old.status !== EquipmentStatus.AVAILABLE) {
      throw new Error('Equipment must be AVAILABLE to replace');
    }

    const newRef = db.collection(COLLECTIONS.EQUIPMENT).doc(newEquipmentDocId);
    const newDocSnap = await transaction.get(newRef);
    if (newDocSnap.exists) {
      throw new Error('Equipment with this serial number already exists');
    }

    const now = Timestamp.now();
    const requestRef = db.collection(COLLECTIONS.EXCHANGE_REQUESTS).doc();

    // Audit: record an approved exchange request with initiatedBySigner=true.
    transaction.set(requestRef, {
      equipmentId: old.id || input.equipmentDocId,
      equipmentDocId: input.equipmentDocId,
      equipmentName: old.productName,
      holderUserId: old.currentHolderId,
      holderUserName: old.currentHolder,
      signerUserId: input.actorId,
      signerUserName: input.actorName,
      reason: input.reason || 'Signer-initiated replacement',
      newEquipmentDocId,
      newSerialNumber: newEquipmentDocId,
      initiatedBySigner: true,
      status: ExchangeRequestStatus.APPROVED,
      statusHistory: [
        {
          status: ExchangeRequestStatus.APPROVED,
          timestamp: now,
          updatedBy: input.actorId,
          updatedByName: input.actorName,
          note: 'Signer-direct replacement',
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
    });

    // Retire old doc with successor link.
    const oldHistoryEntry = {
      action: 'exchange_completed',
      holder: old.currentHolder,
      location: old.location,
      notes: `Replaced by serial ${newEquipmentDocId}${input.reason ? ': ' + input.reason : ''}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.update(oldRef, {
      status: EquipmentStatus.RETIRED,
      successorDocId: newEquipmentDocId,
      trackingHistory: [...(old.trackingHistory || []), oldHistoryEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create new doc.
    const newHistoryEntry = {
      action: 'equipment_created',
      holder: old.currentHolder,
      location: old.location,
      notes: `Created via signer-direct replacement from serial ${old.id || input.equipmentDocId}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.set(newRef, {
      id: newEquipmentDocId,
      equipmentType: old.equipmentType,
      productName: old.productName,
      category: old.category,
      ...(old.subcategory ? { subcategory: old.subcategory } : {}),
      ...(old.model ? { model: old.model } : {}),
      ...(old.manufacturer ? { manufacturer: old.manufacturer } : {}),
      acquisitionDate: now,
      dateSigned: now,
      lastSeen: now,
      lastReportUpdate: now,
      signedBy: old.signedBy,
      signedById: old.signedById,
      currentHolder: old.currentHolder,
      currentHolderId: old.currentHolderId,
      ...(old.holderTeamId ? { holderTeamId: old.holderTeamId } : {}),
      ...(old.signerTeamId ? { signerTeamId: old.signerTeamId } : {}),
      status: EquipmentStatus.AVAILABLE,
      location: old.location,
      condition: EquipmentCondition.GOOD,
      ...(old.catalogNumber ? { catalogNumber: old.catalogNumber } : {}),
      ...(old.requiresDailyStatusCheck !== undefined ? { requiresDailyStatusCheck: old.requiresDailyStatusCheck } : {}),
      ...(old.hasSerialNumber !== undefined ? { hasSerialNumber: old.hasSerialNumber } : {}),
      predecessorDocId: input.equipmentDocId,
      trackingHistory: [newHistoryEntry],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      requestId: requestRef.id,
      newEquipmentDocId,
      oldEquipmentId: old.id || input.equipmentDocId,
      oldEquipmentDocId: input.equipmentDocId,
      equipmentName: old.productName,
      holderUserId: old.currentHolderId,
      holderUserName: old.currentHolder,
    };
  });

  try {
    await serverCreateActionLog({
      actionType: ActionType.EXCHANGE_COMPLETED,
      equipmentId: result.oldEquipmentId,
      equipmentDocId: result.oldEquipmentDocId,
      equipmentName: result.equipmentName,
      actorId: input.actorId,
      actorName: input.actorName,
      targetId: result.holderUserId,
      targetName: result.holderUserName,
      note: `Signer-direct replacement → new serial ${result.newEquipmentDocId}${input.reason ? ': ' + input.reason : ''}`,
    });

    await serverCreateNotification({
      userId: result.holderUserId,
      type: NotificationType.EXCHANGE_COMPLETED,
      title: 'הציוד שלך הוחלף',
      message: `${input.actorName} החליף את ${result.equipmentName} בפריט חדש (מספר סידורי ${result.newEquipmentDocId})`,
      relatedEquipmentId: result.newEquipmentDocId,
      relatedEquipmentDocId: result.newEquipmentDocId,
      equipmentName: result.equipmentName,
    });
  } catch (e) {
    console.error('[Server] Post-replace-by-another side effects failed:', e);
  }

  return { newEquipmentDocId: result.newEquipmentDocId, requestId: result.requestId };
}
