/**
 * Logistics templates — client SDK reads, API-route writes.
 *
 * Templates feed the catalogue picker in /logistics (אפסנאות) when adding a
 * new inventory item, and the management tab for CRUD.
 */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  type Query,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { apiFetch } from '@/lib/apiFetch';
import type {
  LogisticsTemplate,
  CreateLogisticsTemplateInput,
  UpdateLogisticsTemplateInput,
} from '@/types/logistics';

function rowToTemplate(id: string, data: Record<string, unknown>): LogisticsTemplate {
  return {
    id,
    name: String(data.name ?? ''),
    category: String(data.category ?? ''),
    subcategory:
      typeof data.subcategory === 'string' && data.subcategory.length > 0
        ? data.subcategory
        : undefined,
    notes: typeof data.notes === 'string' && data.notes.length > 0 ? data.notes : undefined,
    isActive: !!data.isActive,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
    createdBy: String(data.createdBy ?? ''),
  };
}

export async function listLogisticsTemplates(
  options: { activeOnly?: boolean } = {}
): Promise<LogisticsTemplate[]> {
  try {
    const col = collection(db, COLLECTIONS.LOGISTICS_TEMPLATES);
    const q: Query =
      options.activeOnly === true
        ? query(col, where('isActive', '==', true), orderBy('name'))
        : query(col, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => rowToTemplate(doc.id, doc.data()));
  } catch (error) {
    // Empty collection / missing index — fall back to a plain list and sort
    // client-side. Matches the pattern used in CategoriesRepository.
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.LOGISTICS_TEMPLATES));
      const all = snapshot.docs.map((doc) => rowToTemplate(doc.id, doc.data()));
      const filtered = options.activeOnly ? all.filter((t) => t.isActive) : all;
      return filtered.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    } catch (e) {
      console.warn('Logistics templates read failed:', error, e);
      return [];
    }
  }
}

export async function createLogisticsTemplate(input: CreateLogisticsTemplateInput): Promise<string> {
  const response = await apiFetch('/api/logistics-templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to create template');
  return result.id;
}

export async function updateLogisticsTemplate(
  id: string,
  updates: UpdateLogisticsTemplateInput
): Promise<void> {
  const response = await apiFetch('/api/logistics-templates', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to update template');
}

export async function deactivateLogisticsTemplate(id: string): Promise<void> {
  const response = await apiFetch('/api/logistics-templates', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to deactivate template');
}
