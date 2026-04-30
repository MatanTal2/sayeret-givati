/**
 * One-shot backfill for the `seedKey` field on canonical ammunition templates.
 *
 * Existing CANONICAL docs created before the seedKey schema landed have no
 * seedKey, so a re-seed would treat them as missing and create duplicates.
 * This script joins the live canonical docs to the seed file by name and
 * writes the matching seedKey. Idempotent — docs already carrying a seedKey
 * are skipped.
 *
 * Run once after deploying the seedKey schema, before the next "זרע" click.
 *
 * Credentials: reads `GOOGLE_SERVICE_ACCOUNT_JSON` and
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from `.env.local`. The cred value is
 * auto-detected: plain JSON OR base64-encoded JSON both work.
 *
 * Usage:
 *   node scripts/backfill-ammunition-seed-keys.js [--project <id>] [--dry-run]
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

const COLLECTION = 'ammunitionTemplates';

// Mirror of the seed list — kept inline here to avoid TS transpilation. Order
// and contents must stay in sync with src/data/ammunitionTemplates.ts.
const NAME_TO_SEED_KEY = new Map([
  ['5.56 לבן', 'bullets_5_56_white'],
  ['5.56 ירוק', 'bullets_5_56_green'],
  ['5.56 נותב', 'bullets_5_56_tracer'],
  ['7.62 נותב', 'bullets_7_62_tracer'],
  ['0.5 נותב', 'bullets_0_5_tracer'],
  ['רימון עשן', 'grenade_smoke'],
  ['רימון רסס', 'grenade_fragmentation'],
  ['רימון משגר עשן', 'launcher_smoke'],
  ['רימון משגר רסס', 'launcher_fragmentation'],
  ['רימון משגר תאורה', 'launcher_illum'],
  ['יתד', 'shoulder_yated'],
  ['חולית', 'shoulder_holit'],
  ['לאו', 'shoulder_lao'],
  ['מטאדור', 'shoulder_metador'],
  ['עוקץ פלדה', 'mortar_120_okatz_pelda'],
  ['מוקש קל', 'mine_light'],
  ['נר עשן', 'other_smoke_candle'],
  ['מעיל רוח', 'other_wind_jacket'],
]);

async function main() {
  const snap = await db
    .collection(COLLECTION)
    .where('status', '==', 'CANONICAL')
    .get();
  console.log(`Loaded ${snap.size} canonical templates.`);

  let writes = 0;
  let alreadySet = 0;
  let unmatched = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.seedKey === 'string' && data.seedKey) {
      alreadySet++;
      continue;
    }
    const seedKey = NAME_TO_SEED_KEY.get(data.name);
    if (!seedKey) {
      console.warn(`No seed key for canonical template "${data.name}" (${doc.id}) — skipped`);
      unmatched++;
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] ${doc.id} (${data.name}) → seedKey=${seedKey}`);
    } else {
      await doc.ref.update({
        seedKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    writes++;
  }

  console.log(
    `Done. writes=${writes}, alreadySet=${alreadySet}, unmatched=${unmatched}.${
      dryRun ? ' (dry-run)' : ''
    }`
  );
}

main().catch((e) => {
  console.error('backfill failed:', e);
  process.exit(1);
});
