/**
 * Server-side User Service (firebase-admin)
 * Handles writes to users collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

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
