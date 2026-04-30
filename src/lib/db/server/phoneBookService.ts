/**
 * Server-side Phone Book Service (firebase-admin).
 *
 * The `phoneBook` collection is a downstream, denormalized directory.
 * Every write that adds or changes a phone number on a registered user
 * (or an authorized_personnel row) must call into this service so the
 * directory stays in sync.
 *
 * Doc id strategy:
 *   - For users / authorized_personnel: the `militaryPersonalNumberHash`
 *     so that the same person's entry merges across the registration
 *     transition (personnel-only → personnel + user).
 *   - For external entries (Phase 2): an arbitrary id.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserType } from '@/types/user';

interface UpsertFromUserInput {
  uid: string;
  militaryPersonalNumberHash: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  teamId?: string;
  userType?: UserType;
  photoURL?: string;
}

interface UpsertFromPersonnelInput {
  militaryPersonalNumberHash: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType?: UserType;
  registered?: boolean;
}

function buildDisplayName(firstName?: string, lastName?: string): string {
  const parts = [firstName, lastName].filter((s): s is string => !!s && !!s.trim());
  return parts.join(' ').trim();
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Upsert a phone-book entry from a registered user. Doc id =
 * militaryPersonalNumberHash. Marks the entry as registered.
 *
 * Side-effects only — never throws upstream. Logs and swallows so the
 * caller's primary write (e.g. registration) is not blocked by a directory
 * sync hiccup.
 */
export async function serverUpsertPhoneBookFromUser(input: UpsertFromUserInput): Promise<void> {
  try {
    if (!input.militaryPersonalNumberHash) return;
    const db = getAdminDb();
    const ref = db.collection(COLLECTIONS.PHONE_BOOK).doc(input.militaryPersonalNumberHash);

    const displayName = buildDisplayName(input.firstName, input.lastName) || input.email || input.uid;

    const data = pruneUndefined({
      id: input.militaryPersonalNumberHash,
      source: 'users' as const,
      userId: input.uid,
      militaryPersonalNumberHash: input.militaryPersonalNumberHash,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      teamId: input.teamId,
      userType: input.userType,
      photoURL: input.photoURL,
      isRegistered: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({ ...data, createdAt: FieldValue.serverTimestamp() });
    } else {
      await ref.set(data, { merge: true });
    }
  } catch (e) {
    console.error('[phoneBook] upsert from user failed:', e);
  }
}

/**
 * Upsert a phone-book entry from an authorized_personnel record. Doc id =
 * militaryPersonalNumberHash. `isRegistered` mirrors the personnel flag.
 *
 * Side-effects only — same swallow-and-log policy as the user variant.
 */
export async function serverUpsertPhoneBookFromPersonnel(
  input: UpsertFromPersonnelInput
): Promise<void> {
  try {
    if (!input.militaryPersonalNumberHash) return;
    const db = getAdminDb();
    const ref = db.collection(COLLECTIONS.PHONE_BOOK).doc(input.militaryPersonalNumberHash);

    const displayName = buildDisplayName(input.firstName, input.lastName) || input.militaryPersonalNumberHash;

    const data = pruneUndefined({
      id: input.militaryPersonalNumberHash,
      source: 'authorized_personnel' as const,
      militaryPersonalNumberHash: input.militaryPersonalNumberHash,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName,
      phoneNumber: input.phoneNumber,
      userType: input.userType,
      isRegistered: input.registered ?? false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set({ ...data, createdAt: FieldValue.serverTimestamp() });
    } else {
      // Don't downgrade an already-registered entry: keep `source='users'`
      // and `isRegistered=true` if a personnel-only refresh comes through.
      const prev = existing.data() ?? {};
      const safe: Record<string, unknown> = { ...data };
      if (prev.source === 'users') {
        delete safe.source;
        delete safe.isRegistered;
      }
      await ref.set(safe, { merge: true });
    }
  } catch (e) {
    console.error('[phoneBook] upsert from personnel failed:', e);
  }
}

/**
 * Best-effort delete for a personnel-removal flow. Only deletes the entry
 * if it has no `userId` (i.e. the person never registered) — registered
 * users should keep their phoneBook entry until the underlying user doc
 * is removed.
 */
export async function serverDeletePhoneBookEntryByHash(hash: string): Promise<void> {
  try {
    if (!hash) return;
    const db = getAdminDb();
    const ref = db.collection(COLLECTIONS.PHONE_BOOK).doc(hash);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data() ?? {};
    if (data.userId) return;
    await ref.delete();
  } catch (e) {
    console.error('[phoneBook] delete by hash failed:', e);
  }
}
