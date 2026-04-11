/**
 * Server-side Authorized Personnel Service (firebase-admin)
 * Handles writes to authorized_personnel collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

interface PersonnelDocData {
  militaryPersonalNumberHash: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  userType: string;
  registered: boolean;
  approvedRole: string;
  roleStatus: string;
  status: string;
  createdBy: string;
}

export async function serverAddPersonnel(
  docId: string,
  data: PersonnelDocData
): Promise<string> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(docId).set({
    ...data,
    joinDate: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  return docId;
}

export async function serverUpdatePersonnel(
  personnelId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(personnelId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function serverSyncPersonnelToUser(
  militaryIdHash: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminDb();
  // Find user by militaryPersonalNumberHash
  const userSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where('militaryPersonalNumberHash', '==', militaryIdHash)
    .limit(1)
    .get();

  if (userSnapshot.empty) return;

  const userDocId = userSnapshot.docs[0].id;
  await db.collection(COLLECTIONS.USERS).doc(userDocId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function serverDeletePersonnel(personnelId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(personnelId).delete();
}

export async function serverBulkAddPersonnel(
  entries: { docId: string; data: PersonnelDocData }[]
): Promise<{ successCount: number; failedIndices: number[] }> {
  const db = getAdminDb();
  const BATCH_SIZE = 100;
  let successCount = 0;
  const failedIndices: number[] = [];

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + BATCH_SIZE);

    for (const entry of chunk) {
      const ref = db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(entry.docId);
      batch.set(ref, {
        ...entry.data,
        joinDate: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      successCount += chunk.length;
    } catch {
      // Mark all in this chunk as failed
      for (let j = 0; j < chunk.length; j++) {
        failedIndices.push(i + j);
      }
    }
  }

  return { successCount, failedIndices };
}
