/**
 * Server-side Equipment Draft Service (firebase-admin).
 * Drafts park a user's sign-up work while their associated template request
 * is reviewed. On template approval the user is notified to resume the wizard
 * with the S/N + photo already captured.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { EquipmentDraftStatus } from '@/types/equipment';

interface CreateDraftInput {
  userId: string;
  templateRequestId?: string;
  serialNumber?: string;
  photoUrl?: string;
  catalogNumber?: string;
  notes?: string;
  status?: EquipmentDraftStatus;
}

export async function serverCreateEquipmentDraft(
  input: CreateDraftInput
): Promise<{ id: string }> {
  if (!input.userId) throw new Error('userId is required');
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_DRAFTS).doc();

  const data: Record<string, unknown> = {
    userId: input.userId,
    status: input.status ?? EquipmentDraftStatus.AWAITING_TEMPLATE,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.templateRequestId) data.templateRequestId = input.templateRequestId;
  if (input.serialNumber) data.serialNumber = input.serialNumber;
  if (input.photoUrl) data.photoUrl = input.photoUrl;
  if (input.catalogNumber) data.catalogNumber = input.catalogNumber;
  if (input.notes) data.notes = input.notes;

  await ref.set(data);
  return { id: ref.id };
}

interface UpdateDraftInput {
  draftId: string;
  updates: Partial<{
    serialNumber: string;
    photoUrl: string;
    catalogNumber: string;
    notes: string;
    status: EquipmentDraftStatus;
    templateRequestId: string;
  }>;
}

export async function serverUpdateEquipmentDraft(
  input: UpdateDraftInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_DRAFTS).doc(input.draftId);

  const data: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const [k, v] of Object.entries(input.updates)) {
    if (v !== undefined) data[k] = v;
  }
  await ref.update(data);
}

export async function serverDeleteEquipmentDraft(draftId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.EQUIPMENT_DRAFTS).doc(draftId).delete();
}

/**
 * Find drafts tied to a template request. Used on template approval to flip
 * them to READY_TO_SUBMIT so the owning user can resume sign-up.
 */
export async function serverPromoteDraftsForTemplate(
  templateRequestId: string
): Promise<string[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTIONS.EQUIPMENT_DRAFTS)
    .where('templateRequestId', '==', templateRequestId)
    .get();

  if (snapshot.empty) return [];

  const batch = db.batch();
  const userIds: string[] = [];
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: EquipmentDraftStatus.READY_TO_SUBMIT,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const data = doc.data();
    if (data.userId) userIds.push(data.userId);
  });
  await batch.commit();
  return userIds;
}
