/**
 * Operator-callable purge for old `credentialAuditLog` entries.
 *
 * PR-D shipped the credential audit log; PR-C added PHONE_CHANGED rows.
 * Council answer Q5=a — 1 year retention. This script enforces that:
 * any entry whose `timestamp` is older than 365 days is deleted.
 *
 * A scheduled cron (`/api/cron/purge-credential-audit-log`, 03:30 UTC daily)
 * also runs the same logic in production. This script is the operator
 * fallback when manual control is preferred (one-off cleanup, custom age,
 * preview project, etc.).
 *
 * Credentials + env loading are handled by `_shared/initAdmin.js`.
 *
 * Usage:
 *   node scripts/purge-credential-audit-log.js [--project <id>] [--dry-run] [--age-days <n>]
 *
 * Flags:
 *   --age-days <n>   Override the retention window (default 365).
 */
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const ageDaysRaw = args.valueOf('age-days');
const ageDays = ageDaysRaw !== undefined ? Number(ageDaysRaw) : 365;
if (!Number.isFinite(ageDays) || ageDays <= 0) {
  console.error(`[purge-credential-audit-log] Invalid --age-days value (got "${ageDaysRaw}")`);
  process.exit(1);
}

const { admin, db } = initAdmin({
  projectId: args.projectId,
  scriptName: 'purge-credential-audit-log',
});
const dryRun = args.dryRun;

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
