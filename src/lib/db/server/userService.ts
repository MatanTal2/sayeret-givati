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

/**
 * Updates a user's editable profile fields. Only whitelisted keys are accepted
 * to keep the route tight — roles and permissions are not user-editable here.
 */
const PROFILE_WRITABLE_FIELDS = [
  'teamId',
  'profileImage',
  'phoneNumber',
] as const;
type ProfileWritableField = (typeof PROFILE_WRITABLE_FIELDS)[number];

export async function serverUpdateUserProfile(
  uid: string,
  updates: Partial<Record<ProfileWritableField, string>>,
): Promise<void> {
  const db = getAdminDb();
  const filtered: Record<string, unknown> = {};
  for (const key of PROFILE_WRITABLE_FIELDS) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  if (Object.keys(filtered).length === 0) return;
  filtered.updatedAt = FieldValue.serverTimestamp();
  await db.collection(COLLECTIONS.USERS).doc(uid).update(filtered);
}
