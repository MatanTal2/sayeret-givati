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
import { TemplateStatus } from '@/types/equipment';

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
