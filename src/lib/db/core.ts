/**
 * Generic typed helpers for Firestore operations.
 * Thin layer — complex transactions stay in domain services.
 */
import { getAdminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CollectionName } from './collections';

/**
 * Get a single document by ID (admin SDK)
 */
export async function getDocById<T>(
  collectionName: CollectionName,
  docId: string
): Promise<(T & { id: string }) | null> {
  const snap = await getAdminDb().collection(collectionName).doc(docId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as T & { id: string };
}

/**
 * Create a document (admin SDK).
 * If `docId` is provided, uses `set`; otherwise auto-generates an ID with `add`.
 */
export async function createDoc<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  data: T,
  docId?: string
): Promise<string> {
  const dataWithTimestamp = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (docId) {
    await getAdminDb().collection(collectionName).doc(docId).set(dataWithTimestamp);
    return docId;
  }

  const ref = await getAdminDb().collection(collectionName).add(dataWithTimestamp);
  return ref.id;
}

/**
 * Update a document by ID (admin SDK)
 */
export async function updateDoc<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const dataWithTimestamp = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await getAdminDb().collection(collectionName).doc(docId).update(dataWithTimestamp);
}
