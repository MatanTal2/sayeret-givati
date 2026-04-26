/**
 * Server-side Equipment Items Service (firebase-admin)
 * Handles writes to equipment collection, including transactional creates.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp, type DocumentData, type UpdateData } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import { serverCreateNotification } from './notificationService';
import {
  EquipmentStatus,
  ActionType,
  RetirementRequestStatus,
} from '@/types/equipment';

interface CreateEquipmentInput {
  equipmentData: Record<string, unknown>;
  initialHolderName: string;
  initialHolderId: string;
  signedBy: string;
  trackingHistory: Record<string, unknown>[];
  actionLog: Record<string, unknown>;
}

export async function serverCreateEquipment(input: CreateEquipmentInput): Promise<{ id: string }> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentData.id as string);

  await db.runTransaction(async (transaction) => {
    // Create equipment document
    transaction.set(equipmentRef, {
      ...input.equipmentData,
      currentHolder: input.initialHolderName,
      currentHolderId: input.initialHolderId,
      signedBy: input.signedBy,
      trackingHistory: input.trackingHistory,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create action log entry atomically
    const actionLogRef = db.collection(COLLECTIONS.ACTIONS_LOG).doc();
    transaction.set(actionLogRef, {
      ...input.actionLog,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { id: input.equipmentData.id as string };
}

interface UpdateEquipmentInput {
  equipmentId: string;
  updates: Record<string, unknown>;
  historyEntry: Record<string, unknown>;
  currentTrackingHistory: Record<string, unknown>[];
}

export async function serverUpdateEquipment(input: UpdateEquipmentInput): Promise<void> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentId);

  const doc = await equipmentRef.get();
  if (!doc.exists) {
    throw new Error('Equipment not found');
  }

  await equipmentRef.update({
    ...input.updates,
    trackingHistory: [...input.currentTrackingHistory, input.historyEntry],
    updatedAt: FieldValue.serverTimestamp(),
  });
}

interface TransferEquipmentInput {
  equipmentId: string;
  newHolder: string;
  newHolderId: string;
  newLocation?: string;
  transferEntry: Record<string, unknown>;
  currentTrackingHistory: Record<string, unknown>[];
  currentLocation: string;
}

export async function serverTransferEquipment(input: TransferEquipmentInput): Promise<void> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentId);

  const doc = await equipmentRef.get();
  if (!doc.exists) {
    throw new Error('Equipment not found');
  }

  // Look up the new holder's team from their user profile to keep the
  // denormalized holderTeamId field in sync on transfer.
  const newHolderProfile = await db.collection(COLLECTIONS.USERS).doc(input.newHolderId).get();
  const profileData = newHolderProfile.exists ? newHolderProfile.data() : null;
  const newHolderTeamId = profileData?.teamId ?? null;

  await equipmentRef.update({
    currentHolder: input.newHolder,
    currentHolderId: input.newHolderId,
    holderTeamId: newHolderTeamId,
    location: input.newLocation || input.currentLocation,
    trackingHistory: [...input.currentTrackingHistory, input.transferEntry],
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// -----------------------------------------------------------------------------
// Batch create — sign up multiple items in one atomic op.
// Every item has its own S/N and photo; shared batchId groups them.
// -----------------------------------------------------------------------------

interface BatchItemInput {
  equipmentData: Record<string, unknown>; // Includes id (S/N), productName, photoUrl, etc.
  trackingHistory: Record<string, unknown>[];
  actionLog: Record<string, unknown>;
}

interface CreateBatchInput {
  items: BatchItemInput[];
  batchId: string;
  initialHolderName: string;
  initialHolderId: string;
  signedBy: string;
  signedById: string;
}

export async function serverCreateEquipmentBatch(
  input: CreateBatchInput
): Promise<{ batchId: string; ids: string[] }> {
  if (input.items.length === 0) {
    throw new Error('Batch must contain at least one item');
  }

  const db = getAdminDb();

  // Pre-fetch denormalized team for holder (== signer at sign-up).
  const holderProfile = await db.collection(COLLECTIONS.USERS).doc(input.initialHolderId).get();
  const p = holderProfile.exists ? holderProfile.data() : null;
  const holderTeamId = p?.teamId ?? null;

  const ids: string[] = [];

  await db.runTransaction(async (transaction) => {
    // Reject if any item id already exists.
    const refs = input.items.map((item) =>
      db.collection(COLLECTIONS.EQUIPMENT).doc(item.equipmentData.id as string)
    );
    const snaps = await Promise.all(refs.map((r) => transaction.get(r)));
    for (let i = 0; i < snaps.length; i++) {
      if (snaps[i].exists) {
        throw new Error(`Equipment with serial "${input.items[i].equipmentData.id}" already exists`);
      }
    }

    input.items.forEach((item, idx) => {
      transaction.set(refs[idx], {
        ...item.equipmentData,
        currentHolder: input.initialHolderName,
        currentHolderId: input.initialHolderId,
        signedBy: input.signedBy,
        signedById: input.signedById,
        holderTeamId,
        signerTeamId: holderTeamId,
        batchId: input.batchId,
        trackingHistory: item.trackingHistory,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const actionLogRef = db.collection(COLLECTIONS.ACTIONS_LOG).doc();
      transaction.set(actionLogRef, {
        ...item.actionLog,
        createdAt: FieldValue.serverTimestamp(),
      });

      ids.push(item.equipmentData.id as string);
    });
  });

  return { batchId: input.batchId, ids };
}

// -----------------------------------------------------------------------------
// Report — record a report on an equipment item.
// Updates lastReportUpdate/lastReportPhotoUrl, appends tracking entry,
// writes REPORT_SUBMITTED action log.
// -----------------------------------------------------------------------------

interface ReportEquipmentInput {
  equipmentId: string;
  actorId: string;
  actorName: string;
  photoUrl: string | null; // null only when actor is privileged and chose to skip
  note?: string;
}

export async function serverReportEquipment(input: ReportEquipmentInput): Promise<void> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(equipmentRef);
    if (!doc.exists) throw new Error('Equipment not found');
    const equipment = doc.data()!;

    const now = Timestamp.now();
    const historyEntry: Record<string, unknown> = {
      action: 'report_submitted',
      holder: equipment.currentHolder,
      location: equipment.location,
      notes: input.note || 'Report submitted',
      timestamp: now,
      updatedBy: input.actorId,
    };
    if (input.photoUrl) historyEntry.photoUrl = input.photoUrl;

    const updates: Record<string, unknown> = {
      lastReportUpdate: FieldValue.serverTimestamp(),
      trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.photoUrl) updates.lastReportPhotoUrl = input.photoUrl;

    transaction.update(equipmentRef, updates as UpdateData<DocumentData>);
  });

  // Action log outside transaction (non-critical)
  try {
    const eq = (await equipmentRef.get()).data()!;
    await serverCreateActionLog({
      actionType: ActionType.REPORT_SUBMITTED,
      equipmentId: eq.id || input.equipmentId,
      equipmentDocId: input.equipmentId,
      equipmentName: eq.productName,
      actorId: input.actorId,
      actorName: input.actorName,
      ...(input.note ? { note: input.note } : {}),
    });
  } catch (e) {
    console.error('[Server] Failed to create action log for report:', e);
  }
}

// -----------------------------------------------------------------------------
// Retire — either immediate (signer==holder) or create RetirementRequest.
// Only the signer may initiate; enforced here and at the API layer via policy.
// -----------------------------------------------------------------------------

interface RetireEquipmentInput {
  equipmentId: string;
  actorId: string;
  actorName: string;
  reason: string;
}

export type RetireOutcome =
  | { kind: 'retired' }
  | { kind: 'request_created'; requestId: string };

export async function serverRetireEquipment(
  input: RetireEquipmentInput
): Promise<RetireOutcome> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentId);

  // Run decision + action in a transaction so no race between read and write.
  const outcome = await db.runTransaction<RetireOutcome>(async (transaction) => {
    const doc = await transaction.get(equipmentRef);
    if (!doc.exists) throw new Error('Equipment not found');
    const equipment = doc.data()!;

    if (equipment.signedById !== input.actorId) {
      throw new Error('Only the signer may initiate retirement');
    }

    const now = Timestamp.now();
    const isSignerAndHolder = equipment.currentHolderId === input.actorId;

    if (isSignerAndHolder) {
      // Immediate retire
      const historyEntry = {
        action: 'equipment_retired',
        holder: equipment.currentHolder,
        location: equipment.location,
        notes: `Retired by signer: ${input.reason}`,
        timestamp: now,
        updatedBy: input.actorId,
      };
      transaction.update(equipmentRef, {
        status: EquipmentStatus.RETIRED,
        trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { kind: 'retired' } as const;
    }

    // Signer but not holder → create request, holder must approve.
    const requestRef = db.collection(COLLECTIONS.RETIREMENT_REQUESTS).doc();
    transaction.set(requestRef, {
      equipmentId: equipment.id || input.equipmentId,
      equipmentDocId: input.equipmentId,
      equipmentName: equipment.productName,
      signerUserId: input.actorId,
      signerUserName: input.actorName,
      holderUserId: equipment.currentHolderId,
      holderUserName: equipment.currentHolder,
      reason: input.reason,
      status: RetirementRequestStatus.PENDING,
      statusHistory: [
        {
          status: RetirementRequestStatus.PENDING,
          timestamp: now,
          updatedBy: input.actorId,
          updatedByName: input.actorName,
          note: 'Retirement request created',
        },
      ],
      createdAt: FieldValue.serverTimestamp(),
    });

    // Record the request in equipment history too (status stays unchanged).
    const historyEntry = {
      action: 'retirement_requested',
      holder: equipment.currentHolder,
      location: equipment.location,
      notes: `Retirement requested by ${input.actorName}: ${input.reason}`,
      timestamp: now,
      updatedBy: input.actorId,
    };
    transaction.update(equipmentRef, {
      trackingHistory: [...(equipment.trackingHistory || []), historyEntry],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { kind: 'request_created', requestId: requestRef.id } as const;
  });

  // Post-transaction: action log + notification (non-critical).
  try {
    const eq = (await equipmentRef.get()).data()!;
    if (outcome.kind === 'retired') {
      await serverCreateActionLog({
        actionType: ActionType.EQUIPMENT_RETIRED,
        equipmentId: eq.id || input.equipmentId,
        equipmentDocId: input.equipmentId,
        equipmentName: eq.productName,
        actorId: input.actorId,
        actorName: input.actorName,
        note: input.reason,
      });
    } else {
      await serverCreateActionLog({
        actionType: ActionType.RETIREMENT_REQUESTED,
        equipmentId: eq.id || input.equipmentId,
        equipmentDocId: input.equipmentId,
        equipmentName: eq.productName,
        actorId: input.actorId,
        actorName: input.actorName,
        targetId: eq.currentHolderId,
        targetName: eq.currentHolder,
        note: input.reason,
      });
      // Notify holder that they must approve.
      await serverCreateNotification({
        userId: eq.currentHolderId,
        type: 'retirement_request_approval',
        title: 'בקשת החזרה לצבא',
        message: `${input.actorName} מבקש להחזיר לצבא: ${eq.productName}`,
        relatedEquipmentId: eq.id || input.equipmentId,
        relatedEquipmentDocId: input.equipmentId,
        equipmentName: eq.productName,
      });
    }
  } catch (e) {
    console.error('[Server] Failed post-retire side effects:', e);
  }

  return outcome;
}
