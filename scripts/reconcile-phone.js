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
 * Credentials + env loading are handled by `_shared/initAdmin.js`.
 *
 * Usage:
 *   node scripts/reconcile-phone.js [--project <id>] [--fix]
 *
 * Flags:
 *   --fix   Apply the Firestore mirror push. Without this flag the
 *           script is report-only.
 */
const { createHash } = require('crypto');
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

function hashPhone(e164) {
  return createHash('sha256').update(e164, 'utf8').digest('hex');
}

const args = parseSharedArgs(process.argv.slice(2));
const applyFix = args.flag('fix');
const { admin, db, auth } = initAdmin({
  projectId: args.projectId,
  scriptName: 'reconcile-phone',
});

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
