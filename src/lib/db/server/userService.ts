/**
 * Server-side User Service (firebase-admin)
 * Handles writes to users and authorized_personnel collections during registration.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

interface UserProfileData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Date;
  phoneNumber: string;
  rank: string;
  userType: string;
  role: string;
  status: string;
  militaryPersonalNumberHash: string;
  permissions: string[];
  communicationPreferences: Record<string, unknown>;
}

export async function serverCreateUserProfile(data: UserProfileData): Promise<void> {
  const db = getAdminDb();
  const profile = {
    ...data,
    joinDate: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COLLECTIONS.USERS).doc(data.uid).set(profile);
}

export async function serverMarkAsRegistered(militaryIdHash: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(militaryIdHash).update({
    registered: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
