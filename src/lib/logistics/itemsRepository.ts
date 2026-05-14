/**
 * Logistics items — client SDK reads, API-route writes.
 */
import {
  collection,
  getDocs,
  query,
  orderBy,
  type Query,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { apiFetch } from '@/lib/apiFetch';
import type {
  LogisticsItem,
  CreateLogisticsItemInput,
  UpdateLogisticsItemInput,
} from '@/types/logistics';

function rowToItem(id: string, data: Record<string, unknown>): LogisticsItem {
  return {
    id,
    templateId: String(data.templateId ?? ''),
    name: String(data.name ?? ''),
    category: String(data.category ?? ''),
    subcategory:
      typeof data.subcategory === 'string' && data.subcategory.length > 0
        ? data.subcategory
        : undefined,
    quantity: Number(data.quantity ?? 0),
    location: typeof data.location === 'string' && data.location.length > 0 ? data.location : undefined,
    currentHolderId:
      typeof data.currentHolderId === 'string' && data.currentHolderId.length > 0
        ? data.currentHolderId
        : undefined,
    currentHolderName:
      typeof data.currentHolderName === 'string' && data.currentHolderName.length > 0
        ? data.currentHolderName
        : undefined,
    notes: typeof data.notes === 'string' && data.notes.length > 0 ? data.notes : undefined,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
    createdBy: String(data.createdBy ?? ''),
  };
}

export async function listLogisticsItems(): Promise<LogisticsItem[]> {
  try {
    const q: Query = query(collection(db, COLLECTIONS.LOGISTICS_ITEMS), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => rowToItem(doc.id, doc.data()));
  } catch (error) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.LOGISTICS_ITEMS));
      const all = snapshot.docs.map((doc) => rowToItem(doc.id, doc.data()));
      return all.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    } catch (e) {
      console.warn('Logistics items read failed:', error, e);
      return [];
    }
  }
}

export async function createLogisticsItem(input: CreateLogisticsItemInput): Promise<string> {
  const response = await apiFetch('/api/logistics-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to create item');
  return result.id;
}

export async function updateLogisticsItem(
  id: string,
  updates: UpdateLogisticsItemInput
): Promise<void> {
  const response = await apiFetch('/api/logistics-items', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to update item');
}

export async function deleteLogisticsItem(id: string): Promise<void> {
  const response = await apiFetch('/api/logistics-items', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to delete item');
}
