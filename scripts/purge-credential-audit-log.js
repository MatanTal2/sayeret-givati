/**
 * Operator-callable purge for old `credentialAuditLog` entries.
 *
 * PR-D shipped the credential audit log; PR-C added PHONE_CHANGED rows.
 * Council answer Q5=a — 1 year retention. This script enforces that:
 * any entry whose `timestamp` is older than 365 days is deleted.
 *
 * Designed for manual operator runs first; promotion to a Cloud
 * Scheduler / Cloud Function cron is the next step. Idempotent.
 *
 * Usage:
 *   node scripts/purge-credential-audit-log.js [--project <id>] [--dry-run] [--age-days <n>]
 *
 * Flags:
 *   --project <id>   Override project id (defaults to NEXT_PUBLIC_FIREBASE_PROJECT_ID).
 *   --dry-run        Log planned deletes without persisting.
 *   --age-days <n>   Override the retention window (default 365).
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
const ageIdx = args.indexOf('--age-days');
const ageDays = ageIdx >= 0 ? Number(args[ageIdx + 1]) : 365;

if (!projectId) {
  console.error('Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local)');
  process.exit(1);
}
if (!Number.isFinite(ageDays) || ageDays <= 0) {
  console.error(`Invalid --age-days value (got "${args[ageIdx + 1]}")`);
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
  const cutoffMs = Date.now() - ageDays * 24 * 60 * 60 * 1000;
  const cutoffTs = admin.firestore.Timestamp.fromMillis(cutoffMs);
  console.log(`[purge-credential-audit-log] cutoff=${new Date(cutoffMs).toISOString()} dry=${dryRun}`);

  // Stream the query in pages — `credentialAuditLog` may grow large.
  const PAGE_SIZE = 500;
  let totalDeleted = 0;
  let totalFailed = 0;
  let lastDoc = null;

  // Loop until a page returns zero hits.
  while (true) {
    let query = db
      .collection('credentialAuditLog')
      .where('timestamp', '<', cutoffTs)
      .orderBy('timestamp', 'asc')
      .limit(PAGE_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    if (dryRun) {
      for (const d of snap.docs) console.log(`[dry] would delete credentialAuditLog/${d.id}`);
      totalDeleted += snap.size;
      // Dry-run still needs to advance the cursor so the loop terminates.
      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < PAGE_SIZE) break;
      continue;
    }

    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    try {
      await batch.commit();
      totalDeleted += snap.size;
    } catch (e) {
      totalFailed += snap.size;
      console.error('[fail] batch delete:', e.message);
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }

  console.log(`[purge-credential-audit-log] done. deleted=${totalDeleted} failed=${totalFailed} (${dryRun ? 'dry-run' : 'apply mode'})`);
}

purge().then(() => process.exit(0)).catch((e) => {
  console.error('[purge-credential-audit-log] fatal:', e);
  process.exit(1);
});
