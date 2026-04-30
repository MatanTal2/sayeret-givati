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
 * Credentials: reads `GOOGLE_SERVICE_ACCOUNT_JSON` and
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from `.env.local`. The cred value is
 * auto-detected: plain JSON OR base64-encoded JSON both work.
 *
 * Usage:
 *   node scripts/backfill-equipment-has-serial.js [--project <id>] [--dry-run]
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
  try {
    return JSON.parse(raw);
  } catch {
    // fall through
  }
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
