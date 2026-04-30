/**
 * One-shot backfill for the `phoneBook` collection.
 *
 * Reads `users` and `authorized_personnel` via firebase-admin and upserts
 * the corresponding `phoneBook/{militaryPersonalNumberHash}` doc. Designed
 * to be idempotent — a second run is a no-op when source data has not
 * changed.
 *
 * Doc id strategy: `militaryPersonalNumberHash`. Registered users
 * overwrite the personnel-only entry (source = 'users', isRegistered = true).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json \
 *     ts-node scripts/backfill-phone-book.ts --project sayeret-givati-1983
 *
 * Flags:
 *   --dry-run   Log the planned writes without persisting.
 */
import * as admin from 'firebase-admin';

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const projectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const dryRun = args.includes('--dry-run');

if (!projectId) {
  console.error('Missing --project <projectId>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();

const COLLECTIONS = {
  USERS: 'users',
  AUTHORIZED_PERSONNEL: 'authorized_personnel',
  PHONE_BOOK: 'phoneBook',
} as const;

interface UserRow {
  id: string;
  data: FirebaseFirestore.DocumentData;
}

function buildDisplayName(firstName?: string, lastName?: string, fallback?: string): string {
  const parts = [firstName, lastName].filter((s): s is string => !!s && !!s.trim());
  return parts.join(' ').trim() || fallback || '';
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out as Partial<T>;
}

async function loadUsers(): Promise<UserRow[]> {
  const snap = await db.collection(COLLECTIONS.USERS).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function loadPersonnel(): Promise<UserRow[]> {
  const snap = await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function upsertEntry(hash: string, payload: Record<string, unknown>): Promise<void> {
  const ref = db.collection(COLLECTIONS.PHONE_BOOK).doc(hash);
  if (dryRun) {
    console.log(`[dry-run] upsert ${hash}:`, payload);
    return;
  }
  const existing = await ref.get();
  if (!existing.exists) {
    await ref.set({
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set(
      {
        ...payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

async function main(): Promise<void> {
  const [personnel, users] = await Promise.all([loadPersonnel(), loadUsers()]);
  console.log(`Loaded ${personnel.length} personnel rows and ${users.length} user rows.`);

  let personnelWrites = 0;
  let userWrites = 0;
  let skipped = 0;

  // 1) Seed from authorized_personnel.
  for (const p of personnel) {
    const hash = (p.data.militaryPersonalNumberHash as string) || p.id;
    if (!hash) {
      skipped++;
      continue;
    }
    const data = pruneUndefined({
      id: hash,
      source: 'authorized_personnel' as const,
      militaryPersonalNumberHash: hash,
      firstName: p.data.firstName,
      lastName: p.data.lastName,
      displayName: buildDisplayName(p.data.firstName, p.data.lastName, hash),
      phoneNumber: p.data.phoneNumber,
      userType: p.data.userType,
      isRegistered: !!p.data.registered,
    });
    await upsertEntry(hash, data);
    personnelWrites++;
  }

  // 2) Overlay users (overrides source + isRegistered + adds email/team/photo).
  for (const u of users) {
    const hash = u.data.militaryPersonalNumberHash as string | undefined;
    if (!hash) {
      skipped++;
      continue;
    }
    const data = pruneUndefined({
      id: hash,
      source: 'users' as const,
      userId: u.id,
      militaryPersonalNumberHash: hash,
      firstName: u.data.firstName,
      lastName: u.data.lastName,
      displayName: buildDisplayName(u.data.firstName, u.data.lastName, u.data.email || u.id),
      phoneNumber: u.data.phoneNumber,
      email: u.data.email,
      teamId: u.data.teamId,
      userType: u.data.userType,
      photoURL: u.data.profileImage || u.data.photoURL,
      isRegistered: true,
    });
    await upsertEntry(hash, data);
    userWrites++;
  }

  console.log(
    `Done. personnel=${personnelWrites} writes, users=${userWrites} writes, skipped=${skipped}.${
      dryRun ? ' (dry-run)' : ''
    }`
  );
}

main().catch((e) => {
  console.error('backfill failed:', e);
  process.exit(1);
});
