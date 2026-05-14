/**
 * One-shot backfill for the `hasSerialNumber` field on `equipment` docs.
 *
 * Reads each `equipment` doc, looks up its `equipmentTemplates` template by
 * `equipmentType`, and writes `hasSerialNumber = template.requiresSerialNumber`
 * if the field is missing. Idempotent — docs already carrying the flag are
 * skipped.
 *
 * The flag drives the UI guard that hides "צ: <id>" on items whose `id` is
 * an auto-generated UUID (templates with `requiresSerialNumber === false`).
 *
 * Credentials + env loading are handled by `_shared/initAdmin.js`.
 *
 * Usage:
 *   node scripts/backfill-equipment-has-serial.js [--project <id>] [--dry-run]
 */
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const { admin, db } = initAdmin({
  projectId: args.projectId,
  scriptName: 'backfill-equipment-has-serial',
});
const dryRun = args.dryRun;

const COLLECTIONS = {
  EQUIPMENT: 'equipment',
  EQUIPMENT_TEMPLATES: 'equipmentTemplates',
};

async function loadTemplates() {
  const snap = await db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).get();
  const map = new Map();
  for (const d of snap.docs) {
    const data = d.data();
    map.set(d.id, !!data.requiresSerialNumber);
  }
  return map;
}

async function loadEquipment() {
  const snap = await db.collection(COLLECTIONS.EQUIPMENT).get();
  return snap.docs;
}

async function main() {
  const [templates, equipment] = await Promise.all([loadTemplates(), loadEquipment()]);
  console.log(`Loaded ${templates.size} templates and ${equipment.length} equipment docs.`);

  let writes = 0;
  let skippedAlreadySet = 0;
  let skippedNoTemplate = 0;

  for (const doc of equipment) {
    const data = doc.data();
    if (typeof data.hasSerialNumber === 'boolean') {
      skippedAlreadySet++;
      continue;
    }
    const tmplId = data.equipmentType;
    if (!tmplId || !templates.has(tmplId)) {
      skippedNoTemplate++;
      continue;
    }
    const hasSerialNumber = templates.get(tmplId);
    if (dryRun) {
      console.log(`[dry-run] ${doc.id} → hasSerialNumber=${hasSerialNumber} (template=${tmplId})`);
    } else {
      await doc.ref.update({
        hasSerialNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    writes++;
  }

  console.log(
    `Done. writes=${writes}, alreadySet=${skippedAlreadySet}, noTemplate=${skippedNoTemplate}.${
      dryRun ? ' (dry-run)' : ''
    }`
  );
}

main().catch((e) => {
  console.error('backfill failed:', e);
  process.exit(1);
});
