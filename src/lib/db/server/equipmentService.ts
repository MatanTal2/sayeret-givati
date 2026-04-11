/**
 * Server-side Equipment Items Service (firebase-admin)
 * Handles writes to equipment collection, including transactional creates.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

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
  newUnit?: string;
  newLocation?: string;
  transferEntry: Record<string, unknown>;
  currentTrackingHistory: Record<string, unknown>[];
  currentAssignedUnit: string;
  currentLocation: string;
}

export async function serverTransferEquipment(input: TransferEquipmentInput): Promise<void> {
  const db = getAdminDb();
  const equipmentRef = db.collection(COLLECTIONS.EQUIPMENT).doc(input.equipmentId);

  const doc = await equipmentRef.get();
  if (!doc.exists) {
    throw new Error('Equipment not found');
  }

  await equipmentRef.update({
    currentHolder: input.newHolder,
    currentHolderId: input.newHolderId,
    assignedUnit: input.newUnit || input.currentAssignedUnit,
    location: input.newLocation || input.currentLocation,
    trackingHistory: [...input.currentTrackingHistory, input.transferEntry],
    updatedAt: FieldValue.serverTimestamp(),
  });
}
