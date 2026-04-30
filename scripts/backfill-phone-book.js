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
 * Credentials: reads `GOOGLE_SERVICE_ACCOUNT_JSON` and
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from `.env.local` — same vars the
 * Next.js runtime uses. The cred value is auto-detected: plain JSON OR
 * base64-encoded JSON both work. No separate `sa.json` file required and
 * no transpiler needed.
 *
 * Usage:
 *   node scripts/backfill-phone-book.js [--project <id>] [--dry-run]
 *
 * Flags:
 *   --project <id>   Override project id (defaults to NEXT_PUBLIC_FIREBASE_PROJECT_ID).
 *   --dry-run        Log the planned writes without persisting.
 */
const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const path = require('path');

function loadEnvLocal() {
  try {
    const file = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local missing — fall back to whatever is already in process.env
  }
}

function parseServiceAccount(raw) {
  // Try plain JSON first.
  try {
    return JSON.parse(raw);
  } catch {
    // Fall through.
  }
  // Try base64-encoded JSON.
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_JSON is neither plain JSON nor base64-encoded JSON: ${e.message}`
    );
  }
}

loadEnvLocal();

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const cliProjectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const projectId = cliProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const dryRun = args.includes('--dry-run');

if (!projectId) {
  console.error('Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local)');
  process.exit(1);
}

const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!saRaw) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');
  process.exit(1);
}

let saJson;
try {
  saJson = parseServiceAccount(saRaw);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(saJson),
  projectId,
});

const db = admin.firestore();

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
