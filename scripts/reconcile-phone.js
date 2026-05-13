/**
 * Phone-number reconciler between Firebase Auth and Firestore (Settings PR-C).
 *
 * Scans every `users/{uid}` doc, fetches the matching Firebase Auth user,
 * and reports any divergence between `firebaseAuth.phoneNumber` and
 * `firestore.users.phoneNumber`. With `--fix`, pushes the Firestore mirror
 * forward to match Auth (Auth-wins, because the user has OTP-verified the
 * Auth phone — Firestore drift means the mirror leg of the two-phase
 * confirm failed and needs to be re-applied). Also writes a synthetic
 * PHONE_CHANGED audit row with `metadata.reconciler = true` and reverse-
 * syncs the personnel roster.
 *
 * Designed to be run by an operator after a known incident, not on a cron.
 * Idempotent — a second run with no drift is a no-op.
 *
 * Usage:
 *   node scripts/reconcile-phone.js [--project <id>] [--fix]
 *
 * Flags:
 *   --project <id>   Override project id (defaults to NEXT_PUBLIC_FIREBASE_PROJECT_ID).
 *   --fix            Apply the Firestore mirror push. Without this flag the
 *                    script is report-only.
 */
const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const { createHash } = require('crypto');
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
    // .env.local missing
  }
}

function parseServiceAccount(raw) {
  try { return JSON.parse(raw); } catch { /* try base64 */ }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON is neither plain JSON nor base64-encoded JSON: ${e.message}`);
  }
}

function hashPhone(e164) {
  return createHash('sha256').update(e164, 'utf8').digest('hex');
}

loadEnvLocal();

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const cliProjectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const projectId = cliProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const applyFix = args.includes('--fix');

if (!projectId) {
  console.error('Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local)');
  process.exit(1);
}

const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!saRaw) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(parseServiceAccount(saRaw)),
  projectId,
});

const db = admin.firestore();
const auth = admin.auth();

const COLLECTIONS = {
  USERS: 'users',
  AUTHORIZED_PERSONNEL: 'authorized_personnel',
  CREDENTIAL_AUDIT_LOG: 'credentialAuditLog',
};

async function reconcile() {
  const usersSnap = await db.collection(COLLECTIONS.USERS).get();
  console.log(`[reconcile-phone] scanning ${usersSnap.size} users`);

  let drift = 0;
  let fixed = 0;
  let failed = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const data = userDoc.data();
    const firestorePhone = data.phoneNumber || null;
    const militaryIdHash = data.militaryPersonalNumberHash;

    let authUser;
    try {
      authUser = await auth.getUser(uid);
    } catch (e) {
      console.warn(`[skip] uid=${uid} no Auth record (${e.code || e.message})`);
      continue;
    }
    const authPhone = authUser.phoneNumber || null;

    if (firestorePhone === authPhone) continue;

    drift += 1;
    console.log(`[drift] uid=${uid} firestore=${firestorePhone || 'null'} auth=${authPhone || 'null'}`);

    if (!applyFix) continue;
    if (!authPhone) {
      console.warn(`[skip-fix] uid=${uid} Auth has no phone — refusing to clear Firestore`);
      continue;
    }

    try {
      await db.collection(COLLECTIONS.USERS).doc(uid).update({
        phoneNumber: authPhone,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (militaryIdHash) {
        const personnelRef = db.collection(COLLECTIONS.AUTHORIZED_PERSONNEL).doc(militaryIdHash);
        const personnelSnap = await personnelRef.get();
        if (personnelSnap.exists) {
          await personnelRef.update({
            phoneNumber: authPhone,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      await db.collection(COLLECTIONS.CREDENTIAL_AUDIT_LOG).add({
        uid,
        actorUid: 'system:reconcile-phone',
        actorUserType: 'system',
        eventType: 'PHONE_CHANGED',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          newNumberHash: hashPhone(authPhone),
          ...(firestorePhone ? { oldNumberHash: hashPhone(firestorePhone) } : {}),
          reconciler: true,
        },
      });
      fixed += 1;
      console.log(`[fixed] uid=${uid} → ${authPhone}`);
    } catch (e) {
      failed += 1;
      console.error(`[fail] uid=${uid}:`, e.message);
    }
  }

  console.log(`[reconcile-phone] done. drift=${drift} fixed=${fixed} failed=${failed} (${applyFix ? 'apply mode' : 'report-only'})`);
}

reconcile().then(() => process.exit(0)).catch((e) => {
  console.error('[reconcile-phone] fatal:', e);
  process.exit(1);
});
