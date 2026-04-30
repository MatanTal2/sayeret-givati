/**
 * Server-side Equipment Templates Service (firebase-admin)
 * Handles writes to equipmentTemplates collection.
 *
 * Doc shape must stay aligned with `serverProposeTemplate` so that any
 * downstream filter (currently `templates.filter(t => t.status === CANONICAL)`
 * in the management UI) sees both creation paths the same way. In particular
 * `status` and `requiresSerialNumber` were previously dropped here, leaving
 * canonical-direct-created templates invisible in the canonical list (bug #14).
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { ActionType, TemplateStatus } from '@/types/equipment';
import { serverCreateActionLog } from './actionsLogService';

interface EquipmentTypeInput {
  name: string;
  category: string;
  subcategory: string;
  description?: string;
  notes?: string;
  defaultCatalogNumber?: string;
  requiresDailyStatusCheck: boolean;
  requiresSerialNumber: boolean;
  isActive: boolean;
  templateCreatorId: string;
  status: TemplateStatus;
}

export async function serverCreateEquipmentType(
  data: EquipmentTypeInput
): Promise<{ id: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc();

  const dataToSave: Record<string, unknown> = {
    id: ref.id,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory,
    requiresDailyStatusCheck: data.requiresDailyStatusCheck,
    requiresSerialNumber: data.requiresSerialNumber,
    isActive: data.isActive,
    templateCreatorId: data.templateCreatorId,
    status: data.status,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (data.description) dataToSave.description = data.description;
  if (data.notes) dataToSave.notes = data.notes;
  if (data.defaultCatalogNumber) dataToSave.defaultCatalogNumber = data.defaultCatalogNumber;

  await ref.set(dataToSave);
  return { id: ref.id };
}

export async function serverUpdateEquipmentType(
  typeId: string,
  updates: Partial<EquipmentTypeInput>
): Promise<void> {
  const db = getAdminDb();

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.defaultCatalogNumber !== undefined) updateData.defaultCatalogNumber = updates.defaultCatalogNumber;
  if (updates.requiresDailyStatusCheck !== undefined) updateData.requiresDailyStatusCheck = updates.requiresDailyStatusCheck;
  if (updates.requiresSerialNumber !== undefined) updateData.requiresSerialNumber = updates.requiresSerialNumber;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.templateCreatorId !== undefined) updateData.templateCreatorId = updates.templateCreatorId;
  if (updates.status !== undefined) updateData.status = updates.status;

  await db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(typeId).update(updateData);
}

interface CanonicalEditInput {
  templateId: string;
  actorId: string;
  actorName: string;
  edits: Partial<EquipmentTypeInput>;
}

/**
 * Edit a canonical template. Writes to Firestore + actionsLog. Used by the
 * Manage Templates "edit" action. Status is intentionally not mutable here —
 * lifecycle transitions go through templateRequestService.
 */
export async function serverUpdateCanonicalTemplate(input: CanonicalEditInput): Promise<void> {
  if (!input.templateId) throw new Error('templateId is required');
  const { status: _ignored, ...safeEdits } = input.edits;
  void _ignored;
  await serverUpdateEquipmentType(input.templateId, safeEdits);

  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(input.templateId).get();
  const name = (snap.data()?.name as string) ?? input.edits.name ?? '';

  await serverCreateActionLog({
    actionType: ActionType.TEMPLATE_UPDATED,
    equipmentId: '',
    equipmentDocId: input.templateId,
    equipmentName: name,
    actorId: input.actorId,
    actorName: input.actorName,
  });
}

interface CanonicalRetireInput {
  templateId: string;
  actorId: string;
  actorName: string;
  reason?: string;
}

/**
 * Soft-retire a canonical template by flipping isActive:false. Status is left
 * as CANONICAL so existing Equipment items that reference this template still
 * resolve their template fields, but the wizard's `activeOnly: true` filter
 * hides it from new equipment creation.
 *
 * Physical delete is NOT supported — Equipment items reference template IDs
 * directly and would be orphaned.
 */
export interface EquipmentBulkImportResult {
  created: number;
  errors: Array<{ index: number; error: string }>;
}

interface EquipmentBulkRow {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  subcategory?: unknown;
  requiresSerialNumber?: unknown;
  requiresDailyStatusCheck?: unknown;
  defaultCatalogNumber?: unknown;
  notes?: unknown;
}

/**
 * Validate + write many equipment templates as CANONICAL in one batched
 * commit. Returns per-row errors when validation fails on any row, and only
 * commits the batch when every row validates — admins re-upload after
 * fixing instead of dealing with partial imports.
 */
export async function serverBulkCreateEquipmentTemplates(
  rows: EquipmentBulkRow[],
  templateCreatorId: string
): Promise<EquipmentBulkImportResult> {
  const errors: Array<{ index: number; error: string }> = [];
  const validated: EquipmentTypeInput[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const name = typeof r.name === 'string' ? r.name.trim() : '';
      if (name.length < 2) throw new Error('name must be at least 2 characters');
      const category = typeof r.category === 'string' ? r.category.trim() : '';
      if (!category) throw new Error('category is required');
      const subcategory = typeof r.subcategory === 'string' ? r.subcategory.trim() : '';
      if (!subcategory) throw new Error('subcategory is required');
      if (typeof r.requiresSerialNumber !== 'boolean') {
        throw new Error('requiresSerialNumber must be a boolean');
      }
      if (typeof r.requiresDailyStatusCheck !== 'boolean') {
        throw new Error('requiresDailyStatusCheck must be a boolean');
      }
      const description =
        typeof r.description === 'string' && r.description.trim()
          ? r.description.trim()
          : undefined;
      const notes =
        typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : undefined;
      const defaultCatalogNumber =
        typeof r.defaultCatalogNumber === 'string' && r.defaultCatalogNumber.trim()
          ? r.defaultCatalogNumber.trim()
          : undefined;
      validated.push({
        name,
        category,
        subcategory,
        ...(description ? { description } : {}),
        ...(notes ? { notes } : {}),
        ...(defaultCatalogNumber ? { defaultCatalogNumber } : {}),
        requiresSerialNumber: r.requiresSerialNumber,
        requiresDailyStatusCheck: r.requiresDailyStatusCheck,
        isActive: true,
        templateCreatorId,
        status: TemplateStatus.CANONICAL,
      });
    } catch (e) {
      errors.push({ index: i, error: e instanceof Error ? e.message : String(e) });
    }
  }
  if (errors.length > 0) return { created: 0, errors };

  const db = getAdminDb();
  const col = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES);
  const batch = db.batch();
  for (const input of validated) {
    const ref = col.doc();
    const data: Record<string, unknown> = {
      id: ref.id,
      name: input.name,
      category: input.category,
      subcategory: input.subcategory,
      requiresDailyStatusCheck: input.requiresDailyStatusCheck,
      requiresSerialNumber: input.requiresSerialNumber,
      isActive: input.isActive,
      templateCreatorId: input.templateCreatorId,
      status: input.status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.description) data.description = input.description;
    if (input.notes) data.notes = input.notes;
    if (input.defaultCatalogNumber) data.defaultCatalogNumber = input.defaultCatalogNumber;
    batch.set(ref, data);
  }
  await batch.commit();
  return { created: validated.length, errors: [] };
}

export async function serverRetireCanonicalTemplate(input: CanonicalRetireInput): Promise<void> {
  if (!input.templateId) throw new Error('templateId is required');
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(input.templateId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('Template not found');
  const template = snap.data()!;
  if (template.status !== TemplateStatus.CANONICAL) {
    throw new Error('Only canonical templates can be retired');
  }

  await ref.update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await serverCreateActionLog({
    actionType: ActionType.TEMPLATE_RETIRED,
    equipmentId: '',
    equipmentDocId: input.templateId,
    equipmentName: (template.name as string) ?? '',
    actorId: input.actorId,
    actorName: input.actorName,
    ...(input.reason ? { note: input.reason } : {}),
  });
}
