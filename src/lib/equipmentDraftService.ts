/**
 * Equipment Draft Service — client facade.
 * Reads via client SDK; writes via /api/equipment-drafts.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  EquipmentDraft,
  EquipmentDraftStatus,
} from '@/types/equipment';

interface CreateDraftArgs {
  templateRequestId?: string;
  serialNumber?: string;
  photoUrl?: string;
  catalogNumber?: string;
  notes?: string;
  status?: EquipmentDraftStatus;
}

export async function createEquipmentDraft(args: CreateDraftArgs): Promise<string> {
  const response = await apiFetch('/api/equipment-drafts', {
    method: 'POST',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to create draft');
  return result.id;
}

interface UpdateDraftArgs {
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

export async function updateEquipmentDraft(args: UpdateDraftArgs): Promise<void> {
  const response = await apiFetch('/api/equipment-drafts', {
    method: 'PUT',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to update draft');
}

export async function deleteEquipmentDraft(draftId: string): Promise<void> {
  const response = await apiFetch('/api/equipment-drafts', {
    method: 'DELETE',
    body: JSON.stringify({ draftId }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to delete draft');
}

export async function getDraftsForUser(userId: string): Promise<EquipmentDraft[]> {
  const q = query(
    collection(db, COLLECTIONS.EQUIPMENT_DRAFTS),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EquipmentDraft));
}

export async function getDraft(draftId: string): Promise<EquipmentDraft | null> {
  const ref = doc(db, COLLECTIONS.EQUIPMENT_DRAFTS, draftId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EquipmentDraft;
}
