/**
 * Server-side Categories Service (firebase-admin)
 * Handles all writes to categories and subcategories collections.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

interface CategoryInput {
  name: string;
  order: number;
  isActive: boolean;
  createdBy: string;
}

interface SubcategoryInput {
  name: string;
  parentCategoryId: string;
  order: number;
  isActive: boolean;
  createdBy: string;
}

export async function serverCreateCategory(data: CategoryInput): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection(COLLECTIONS.CATEGORIES).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function serverCreateSubcategory(data: SubcategoryInput): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection(COLLECTIONS.SUBCATEGORIES).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function serverUpdateCategory(
  categoryId: string,
  updates: { name?: string; order?: number; isActive?: boolean }
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function serverUpdateSubcategory(
  subcategoryId: string,
  updates: { name?: string; order?: number; isActive?: boolean }
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.SUBCATEGORIES).doc(subcategoryId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function serverDeactivateCategory(categoryId: string): Promise<void> {
  const db = getAdminDb();
  const batch = db.batch();

  // Deactivate category
  const categoryRef = db.collection(COLLECTIONS.CATEGORIES).doc(categoryId);
  batch.update(categoryRef, {
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Deactivate all child subcategories
  const subcategoriesSnapshot = await db
    .collection(COLLECTIONS.SUBCATEGORIES)
    .where('parentCategoryId', '==', categoryId)
    .get();

  subcategoriesSnapshot.forEach((doc) => {
    batch.update(doc.ref, {
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function serverDeactivateSubcategory(subcategoryId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.SUBCATEGORIES).doc(subcategoryId).update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
