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
 * Credentials + env loading are handled by `_shared/initAdmin.js` — see
 * that module for the full env contract.
 *
 * Usage:
 *   node scripts/backfill-phone-book.js [--project <id>] [--dry-run]
 */
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const { admin, db } = initAdmin({
  projectId: args.projectId,
  scriptName: 'backfill-phone-book',
});
const dryRun = args.dryRun;

const COLLECTIONS = {
  USERS: 'users',
  AUTHORIZED_PERSONNEL: 'authorized_personnel',
  PHONE_BOOK: 'phoneBook',
};

function buildDisplayName(firstName, lastName, fallback) {
  const parts = [firstName, lastName].filter((s) => !!s && !!String(s).trim());
  return parts.join(' ').trim() || fallback || '';
}

function pruneUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

async function loadUsers() {
  const snap = await db.collection(COLLECTIONS.USERS).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function loadPersonnel() {
  const snap = await db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function upsertEntry(hash, payload) {
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

async function main() {
  const [personnel, users] = await Promise.all([loadPersonnel(), loadUsers()]);
  console.log(`Loaded ${personnel.length} personnel rows and ${users.length} user rows.`);

  let personnelWrites = 0;
  let userWrites = 0;
  let skipped = 0;

  // 1) Seed from authorized_personnel.
  for (const p of personnel) {
    const hash = p.data.militaryPersonalNumberHash || p.id;
    if (!hash) {
      skipped++;
      continue;
    }
    const data = pruneUndefined({
      id: hash,
      source: 'authorized_personnel',
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
    const hash = u.data.militaryPersonalNumberHash;
    if (!hash) {
      skipped++;
      continue;
    }
    const data = pruneUndefined({
      id: hash,
      source: 'users',
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
