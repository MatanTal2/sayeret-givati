/**
 * One-shot migration: read a CSV export of the legacy Google Sheet status
 * source and write each row's status to `soldierStatus/{militaryPersonalNumberHash}`.
 *
 * The CSV must contain (in column order): id, firstName, lastName, platoon, status.
 * Header row is skipped. Roster fields (firstName, lastName, platoon) are NOT
 * migrated — they live in `users` ∪ `authorized_personnel`. Rows whose hashed
 * personnel number does not match any existing roster doc are logged and skipped.
 *
 * Usage:
 *   1. Export the existing Google Sheet to CSV (File → Download → Comma-separated values)
 *   2. GOOGLE_APPLICATION_CREDENTIALS=./sa.json \
 *      ts-node scripts/migrate-soldier-status.ts --project sayeret-givati-1983 --csv ./sheet-export.csv
 *
 * Optional flags:
 *   --dry-run   Log planned writes without persisting.
 *
 * The script is idempotent: a second run with the same CSV is a no-op.
 *
 * After successful run + verification, this script and the legacy
 * `googleapis` dependency in package.json can be removed.
 */

import * as admin from 'firebase-admin';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const csvIdx = args.indexOf('--csv');
const projectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const csvPath = csvIdx >= 0 ? args[csvIdx + 1] : undefined;
const dryRun = args.includes('--dry-run');

if (!projectId) {
  console.error('Missing --project <projectId>');
  process.exit(1);
}
if (!csvPath) {
  console.error('Missing --csv <path>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();

function hashPersonnelNumber(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function mapRawStatusToStructured(raw: string): { status: 'בית' | 'משמר' | 'אחר'; customStatus?: string } {
  if (raw === 'בית' || raw === 'משמר') {
    return { status: raw };
  }
  return { status: 'אחר', customStatus: raw };
}

function parseCsv(text: string): string[][] {
  // Naive CSV parse — sufficient for the sheet's flat shape (no embedded
  // commas / quotes in this dataset). Splits on \r?\n then on commas; trims
  // surrounding double-quotes if present.
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) =>
      line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
    );
}

async function loadKnownHashes(): Promise<Set<string>> {
  const known = new Set<string>();
  const personnelSnap = await db.collection('authorized_personnel').get();
  for (const doc of personnelSnap.docs) known.add(doc.id);

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (typeof data.militaryPersonalNumberHash === 'string') {
      known.add(data.militaryPersonalNumberHash);
    }
  }
  return known;
}

async function migrate() {
  const csvText = readFileSync(csvPath!, 'utf-8');
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    console.error('CSV appears empty or missing header row');
    process.exit(1);
  }
  console.log(`Loaded ${rows.length - 1} data rows from ${csvPath}`);

  const knownHashes = await loadKnownHashes();
  console.log(`Loaded ${knownHashes.size} known roster hashes`);

  const [, ...body] = rows;
  let written = 0;
  let skippedNoMatch = 0;
  let skippedNoId = 0;

  for (const row of body) {
    const rawId = (row[0] ?? '').trim();
    const rawStatus = (row[4] ?? '').trim() || 'בית';
    if (!rawId) {
      skippedNoId++;
      continue;
    }
    const hash = hashPersonnelNumber(rawId);
    if (!knownHashes.has(hash)) {
      console.warn(`SKIP: no roster match for raw id "${rawId}" (hash ${hash.slice(0, 12)}…)`);
      skippedNoMatch++;
      continue;
    }
    const { status, customStatus } = mapRawStatusToStructured(rawStatus);
    const data: Record<string, unknown> = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (customStatus !== undefined) {
      data.customStatus = customStatus;
    }
    if (dryRun) {
      console.log(`DRY: would write soldierStatus/${hash.slice(0, 12)}… = ${JSON.stringify({ status, customStatus })}`);
    } else {
      await db.collection('soldierStatus').doc(hash).set(data, { merge: true });
    }
    written++;
  }

  console.log(`\nSummary:`);
  console.log(`  Written:            ${written}`);
  console.log(`  Skipped (no match): ${skippedNoMatch}`);
  console.log(`  Skipped (no id):    ${skippedNoId}`);
  if (dryRun) console.log(`(dry run — no writes persisted)`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
