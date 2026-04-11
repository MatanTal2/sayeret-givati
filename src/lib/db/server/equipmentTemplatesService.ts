/**
 * Server-side Equipment Templates Service (firebase-admin)
 * Handles writes to equipmentTemplates collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

interface EquipmentTypeInput {
  name: string;
  category: string;
  subcategory: string;
  description?: string;
  notes?: string;
  requiresDailyStatusCheck: boolean;
  isActive: boolean;
  templateCreatorId: string;
}

export async function serverCreateEquipmentType(
  data: EquipmentTypeInput
): Promise<{ id: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc();

  // Build data object, excluding undefined optional fields
  const dataToSave: Record<string, unknown> = {
    id: ref.id,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory,
    requiresDailyStatusCheck: data.requiresDailyStatusCheck,
    isActive: data.isActive,
    templateCreatorId: data.templateCreatorId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (data.description) dataToSave.description = data.description;
  if (data.notes) dataToSave.notes = data.notes;

  await ref.set(dataToSave);
  return { id: ref.id };
}

export async function serverUpdateEquipmentType(
  typeId: string,
  updates: Partial<EquipmentTypeInput>
): Promise<void> {
  const db = getAdminDb();

  // Build update object, excluding undefined values
  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.requiresDailyStatusCheck !== undefined) updateData.requiresDailyStatusCheck = updates.requiresDailyStatusCheck;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.templateCreatorId !== undefined) updateData.templateCreatorId = updates.templateCreatorId;

  await db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(typeId).update(updateData);
}
