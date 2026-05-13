/**
 * Operator-callable purge for stale `phoneChangePending` reservations.
 *
 * PR-C's two-phase flow writes `phoneChangePending/{uid}` on initiate
 * and deletes it on confirm. If the user closes the modal between the
 * two steps and the client's `cancel` POST never reaches the server
 * (offline / hard refresh), the pending doc sits there indefinitely.
 *
 * The initiate route's 60s rate-limit already overwrites the slot on
 * the same user's next attempt, so stale docs don't block the user.
 * But operationally they're noise — this script sweeps anything older
 * than 24 hours.
 *
 * Designed for manual operator runs first; promotion to a Cloud
 * Scheduler / Cloud Function cron is the next step.
 *
 * Usage:
 *   node scripts/purge-phone-change-pending.js [--project <id>] [--dry-run] [--age-hours <n>]
 *
 * Flags:
 *   --project <id>   Override project id (defaults to NEXT_PUBLIC_FIREBASE_PROJECT_ID).
 *   --dry-run        Log planned deletes without persisting.
 *   --age-hours <n>  Override the staleness threshold (default 24).
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

loadEnvLocal();

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const cliProjectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const projectId = cliProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const dryRun = args.includes('--dry-run');
const ageIdx = args.indexOf('--age-hours');
const ageHours = ageIdx >= 0 ? Number(args[ageIdx + 1]) : 24;

if (!projectId) {
  console.error('Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local)');
  process.exit(1);
}
if (!Number.isFinite(ageHours) || ageHours <= 0) {
  console.error(`Invalid --age-hours value (got "${args[ageIdx + 1]}")`);
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

async function purge() {
  const cutoffMs = Date.now() - ageHours * 60 * 60 * 1000;
  const cutoffTs = admin.firestore.Timestamp.fromMillis(cutoffMs);
  console.log(`[purge-phone-change-pending] cutoff=${new Date(cutoffMs).toISOString()} dry=${dryRun}`);

  const snap = await db
    .collection('phoneChangePending')
    .where('createdAt', '<', cutoffTs)
    .get();

  console.log(`[purge-phone-change-pending] found ${snap.size} stale reservation(s)`);

  let deleted = 0;
  let failed = 0;
  const BATCH_SIZE = 400;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    if (dryRun) {
      for (const d of chunk) console.log(`[dry] would delete phoneChangePending/${d.id}`);
      deleted += chunk.length;
      continue;
    }
    const batch = db.batch();
    for (const d of chunk) batch.delete(d.ref);
    try {
      await batch.commit();
      deleted += chunk.length;
    } catch (e) {
      failed += chunk.length;
      console.error('[fail] batch delete:', e.message);
    }
  }

  console.log(`[purge-phone-change-pending] done. deleted=${deleted} failed=${failed} (${dryRun ? 'dry-run' : 'apply mode'})`);
}

purge().then(() => process.exit(0)).catch((e) => {
  console.error('[purge-phone-change-pending] fatal:', e);
  process.exit(1);
});
