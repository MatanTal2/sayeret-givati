/**
 * Server-side User Service (firebase-admin)
 * Handles writes to users collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type { CommunicationPreferences } from '@/types/user';

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
const STRING_FIELDS = [
  'teamId',
  'profileImage',
  'enlistmentCycle',
  'address',
] as const;
type StringField = (typeof STRING_FIELDS)[number];

const COMM_PREF_BOOLEAN_KEYS = [
  'emailNotifications',
  'equipmentTransferAlerts',
  'systemUpdates',
  'schedulingAlerts',
  'emergencyNotifications',
] as const;
type CommPrefBooleanKey = (typeof COMM_PREF_BOOLEAN_KEYS)[number];

export type ProfileUpdatePayload = Partial<Record<StringField, string>> & {
  communicationPreferences?: Partial<Pick<CommunicationPreferences, CommPrefBooleanKey>>;
};

export class InvalidProfileUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProfileUpdateError';
  }
}

/**
 * Validates a `communicationPreferences` patch — only known boolean keys are
 * allowed. Unknown keys reject hard so clients can't smuggle arbitrary nested
 * data into the users doc via this surface.
 *
 * Writes use dotted field paths so a partial patch only touches the keys the
 * caller sent and leaves the other preference flags intact.
 */
function buildCommPrefDotPaths(
  raw: unknown,
  actorUid: string,
): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new InvalidProfileUpdateError('communicationPreferences must be an object');
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(COMM_PREF_BOOLEAN_KEYS as readonly string[]).includes(key)) {
      throw new InvalidProfileUpdateError(`unknown communicationPreferences key: ${key}`);
    }
    if (typeof value !== 'boolean') {
      throw new InvalidProfileUpdateError(`communicationPreferences.${key} must be boolean`);
    }
    out[`communicationPreferences.${key}`] = value;
  }
  if (Object.keys(out).length === 0) return out;
  out['communicationPreferences.lastUpdated'] = FieldValue.serverTimestamp();
  out['communicationPreferences.updatedBy'] = actorUid;
  return out;
}

export async function serverUpdateUserProfile(
  uid: string,
  updates: ProfileUpdatePayload,
  actorUid: string = uid,
): Promise<void> {
  const db = getAdminDb();
  const filtered: Record<string, unknown> = {};
  for (const key of STRING_FIELDS) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  if (updates.communicationPreferences !== undefined) {
    Object.assign(filtered, buildCommPrefDotPaths(updates.communicationPreferences, actorUid));
  }
  if (Object.keys(filtered).length === 0) return;
  filtered.updatedAt = FieldValue.serverTimestamp();
  await db.collection(COLLECTIONS.USERS).doc(uid).update(filtered);
}
