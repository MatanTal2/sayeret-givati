/**
 * Server-side Authorized Personnel Service (firebase-admin)
 * Handles writes to authorized_personnel collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '@/types/equipment';
import { serverDeletePhoneBookEntryByHash } from './phoneBookService';

interface PersonnelDocData {
  militaryPersonalNumberHash: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  userType: string;
  registered: boolean;
  approvedRole: UserRole;
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

/**
 * Reverse-sync the user-owned phone change back to the authorized_personnel
 * roster doc (Q1=a). Narrow scope — only the phoneNumber field, no
 * status/role/name leak.
 *
 * Silent no-op if the personnel doc doesn't exist (legacy users without a
 * matching roster row). Returns whether a write happened so the caller can
 * decide to surface a warning.
 */
export async function serverWritePhoneToPersonnel(
  militaryIdHash: string,
  newPhoneE164: string,
): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(militaryIdHash);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.update({
    phoneNumber: newPhoneE164,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return true;
}

export async function serverDeletePersonnel(personnelId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(personnelId).delete();
  // Personnel doc id IS the militaryPersonalNumberHash, so we can evict the
  // matching phone-book entry directly. The helper is a no-op for registered
  // users (rows with `userId`), so it only removes personnel-only entries.
  await serverDeletePhoneBookEntryByHash(personnelId);
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
