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
 *
 * `phoneNumber` is INTENTIONALLY excluded. Phone is an identity anchor and
 * MUST flow through a dedicated change route that requires (a) fresh password
 * re-auth and (b) a Firebase Auth `updatePhoneNumber` credential proof. See
 * `project_settings_page.md` PR-C. The route layer also 400s explicitly on
 * any `phoneNumber` field so the rejection is loud, not silent.
 */
const PROFILE_WRITABLE_FIELDS = [
  'teamId',
  'profileImage',
  'enlistmentCycle',
  'address',
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
