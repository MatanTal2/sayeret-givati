/**
 * Server-side Logistics Items Service (firebase-admin).
 *
 * Items are non-serialized inventory rows in `logisticsItems`. Each item is
 * created from a template (the template snapshots `name`, `category`, and
 * `subcategory` onto the item so rename + later edits don't silently
 * rewrite history). The API route is the permission boundary.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  CreateLogisticsItemInput,
  UpdateLogisticsItemInput,
} from '@/types/logistics';

export interface ValidatedItemInput extends CreateLogisticsItemInput {
  createdBy: string;
}

export function validateLogisticsItemInput(input: unknown): ValidatedItemInput {
  if (!input || typeof input !== 'object') {
    throw new Error('input is required');
  }
  const i = input as Record<string, unknown>;
  if (typeof i.templateId !== 'string' || !i.templateId.trim()) {
    throw new Error('templateId is required');
  }
  if (typeof i.quantity !== 'number' || !Number.isFinite(i.quantity) || i.quantity < 0) {
    throw new Error('quantity must be a non-negative number');
  }
  if (i.location !== undefined && typeof i.location !== 'string') {
    throw new Error('location must be a string');
  }
  if (i.currentHolderId !== undefined && typeof i.currentHolderId !== 'string') {
    throw new Error('currentHolderId must be a string');
  }
  if (i.currentHolderName !== undefined && typeof i.currentHolderName !== 'string') {
    throw new Error('currentHolderName must be a string');
  }
  if (i.notes !== undefined && typeof i.notes !== 'string') {
    throw new Error('notes must be a string');
  }
  if (typeof i.createdBy !== 'string' || !i.createdBy) {
    throw new Error('createdBy is required');
  }
  return {
    templateId: i.templateId.trim(),
    quantity: i.quantity,
    location: typeof i.location === 'string' ? i.location.trim() || undefined : undefined,
    currentHolderId:
      typeof i.currentHolderId === 'string' ? i.currentHolderId.trim() || undefined : undefined,
    currentHolderName:
      typeof i.currentHolderName === 'string'
        ? i.currentHolderName.trim() || undefined
        : undefined,
    notes: typeof i.notes === 'string' ? i.notes.trim() || undefined : undefined,
    createdBy: i.createdBy,
  };
}

export async function serverCreateLogisticsItem(input: ValidatedItemInput): Promise<string> {
  const db = getAdminDb();
  const templateSnap = await db
    .collection(COLLECTIONS.LOGISTICS_TEMPLATES)
    .doc(input.templateId)
    .get();
  if (!templateSnap.exists) {
    throw new Error('Template not found');
  }
  const tpl = templateSnap.data() ?? {};
  const ref = await db.collection(COLLECTIONS.LOGISTICS_ITEMS).add({
    templateId: input.templateId,
    name: tpl.name ?? '',
    category: tpl.category ?? '',
    subcategory: tpl.subcategory ?? null,
    quantity: input.quantity,
    location: input.location ?? null,
    currentHolderId: input.currentHolderId ?? null,
    currentHolderName: input.currentHolderName ?? null,
    notes: input.notes ?? null,
    createdBy: input.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function serverUpdateLogisticsItem(
  itemId: string,
  updates: UpdateLogisticsItemInput
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.quantity !== undefined) {
    if (typeof updates.quantity !== 'number' || !Number.isFinite(updates.quantity) || updates.quantity < 0) {
      throw new Error('quantity must be a non-negative number');
    }
    patch.quantity = updates.quantity;
  }
  if (updates.location !== undefined) {
    patch.location = (updates.location ?? '').toString().trim() || null;
  }
  if (updates.currentHolderId !== undefined) {
    patch.currentHolderId = (updates.currentHolderId ?? '').toString().trim() || null;
  }
  if (updates.currentHolderName !== undefined) {
    patch.currentHolderName = (updates.currentHolderName ?? '').toString().trim() || null;
  }
  if (updates.notes !== undefined) {
    patch.notes = (updates.notes ?? '').toString().trim() || null;
  }
  if (Object.keys(patch).length === 0) return;
  patch.updatedAt = FieldValue.serverTimestamp();
  const db = getAdminDb();
  await db.collection(COLLECTIONS.LOGISTICS_ITEMS).doc(itemId).update(patch);
}

export async function serverDeleteLogisticsItem(itemId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.LOGISTICS_ITEMS).doc(itemId).delete();
}
