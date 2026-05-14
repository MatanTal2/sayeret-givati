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
 * Credentials + env loading are handled by `_shared/initAdmin.js`.
 *
 * Usage:
 *   node scripts/purge-phone-change-pending.js [--project <id>] [--dry-run] [--age-hours <n>]
 *
 * Flags:
 *   --age-hours <n>  Override the staleness threshold (default 24).
 */
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const ageHoursRaw = args.valueOf('age-hours');
const ageHours = ageHoursRaw !== undefined ? Number(ageHoursRaw) : 24;
if (!Number.isFinite(ageHours) || ageHours <= 0) {
  console.error(`[purge-phone-change-pending] Invalid --age-hours value (got "${ageHoursRaw}")`);
  process.exit(1);
}

const { admin, db } = initAdmin({
  projectId: args.projectId,
  scriptName: 'purge-phone-change-pending',
});
const dryRun = args.dryRun;

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
