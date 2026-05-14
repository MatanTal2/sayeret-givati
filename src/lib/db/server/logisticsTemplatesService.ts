/**
 * Server-side Logistics Templates Service (firebase-admin).
 *
 * Templates define the catalogue of non-serialized supplies the unit tracks
 * ("אפסנאות"). Categories + subcategories are freeform strings — unit-specific
 * taxonomy that lives alongside the template rather than in a separate
 * collection. The API route is the permission boundary; this service trusts
 * its caller.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  CreateLogisticsTemplateInput,
  UpdateLogisticsTemplateInput,
} from '@/types/logistics';

export interface ValidatedTemplateInput extends CreateLogisticsTemplateInput {
  createdBy: string;
}

export function validateLogisticsTemplateInput(input: unknown): ValidatedTemplateInput {
  if (!input || typeof input !== 'object') {
    throw new Error('input is required');
  }
  const i = input as Record<string, unknown>;
  if (typeof i.name !== 'string' || i.name.trim().length < 2) {
    throw new Error('name must be at least 2 characters');
  }
  if (typeof i.category !== 'string' || i.category.trim().length === 0) {
    throw new Error('category is required');
  }
  if (i.subcategory !== undefined && typeof i.subcategory !== 'string') {
    throw new Error('subcategory must be a string');
  }
  if (i.notes !== undefined && typeof i.notes !== 'string') {
    throw new Error('notes must be a string');
  }
  if (typeof i.createdBy !== 'string' || !i.createdBy) {
    throw new Error('createdBy is required');
  }
  return {
    name: i.name.trim(),
    category: i.category.trim(),
    subcategory: typeof i.subcategory === 'string' ? i.subcategory.trim() || undefined : undefined,
    notes: typeof i.notes === 'string' ? i.notes.trim() || undefined : undefined,
    createdBy: i.createdBy,
  };
}

export async function serverCreateLogisticsTemplate(input: ValidatedTemplateInput): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection(COLLECTIONS.LOGISTICS_TEMPLATES).add({
    name: input.name,
    category: input.category,
    subcategory: input.subcategory ?? null,
    notes: input.notes ?? null,
    isActive: true,
    createdBy: input.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function serverUpdateLogisticsTemplate(
  templateId: string,
  updates: UpdateLogisticsTemplateInput
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (trimmed.length < 2) throw new Error('name must be at least 2 characters');
    patch.name = trimmed;
  }
  if (updates.category !== undefined) {
    const trimmed = updates.category.trim();
    if (trimmed.length === 0) throw new Error('category cannot be empty');
    patch.category = trimmed;
  }
  if (updates.subcategory !== undefined) {
    patch.subcategory = updates.subcategory.trim() || null;
  }
  if (updates.notes !== undefined) {
    patch.notes = updates.notes.trim() || null;
  }
  if (updates.isActive !== undefined) {
    patch.isActive = !!updates.isActive;
  }
  if (Object.keys(patch).length === 0) return;
  patch.updatedAt = FieldValue.serverTimestamp();
  const db = getAdminDb();
  await db.collection(COLLECTIONS.LOGISTICS_TEMPLATES).doc(templateId).update(patch);
}

export async function serverDeactivateLogisticsTemplate(templateId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.LOGISTICS_TEMPLATES).doc(templateId).update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

