/**
 * One-shot migration: rename
 *   `systemConfig/main.ammoNotificationRecipientUserId` (string)
 *   →
 *   `systemConfig/main.ammoNotificationRecipientUserIds` (string[])
 *
 * Behaviour (idempotent):
 *   - new field already present (array)  → no-op, skip
 *   - old field present + non-empty      → write `[<old>]` AND delete old
 *   - old field absent / empty           → write `[]` AND delete old if any
 *
 * Service-account credential + project id are read from `.env.local` using
 * the same conventions as the rest of `scripts/`:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON     (plain JSON or base64-encoded JSON)
 *   - NEXT_PUBLIC_FIREBASE_PROJECT_ID (or pass --project <id> on the CLI)
 *
 * Usage:
 *   node scripts/migrate-ammo-recipient-to-array.mjs              # apply
 *   node scripts/migrate-ammo-recipient-to-array.mjs --dry-run    # log only
 *   node scripts/migrate-ammo-recipient-to-array.mjs --project xyz
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import admin from 'firebase-admin';

function loadEnvLocal() {
  try {
    const file = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
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
    /* .env.local missing — caller may have exported env vars directly. */
  }
}

function parseServiceAccount(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to base64 */
  }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_JSON is neither plain JSON nor base64-encoded JSON: ${e.message}`,
    );
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const projectIdx = args.indexOf('--project');
  const cliProject = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
  return {
    dryRun: args.includes('--dry-run'),
    projectId: cliProject || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
}

async function main() {
  loadEnvLocal();
  const { dryRun, projectId } = parseArgs(process.argv);

  if (!projectId) {
    console.error('[migrate] Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID).');
    process.exit(1);
  }
  const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saRaw) {
    console.error('[migrate] Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');
    process.exit(1);
  }

  const saJson = parseServiceAccount(saRaw);
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(saJson),
      projectId,
    });
  }
  const db = admin.firestore();
  const ref = db.collection('systemConfig').doc('main');
  const snap = await ref.get();

  if (!snap.exists) {
    console.log('[migrate] systemConfig/main does not exist — nothing to migrate.');
    return;
  }

  const data = snap.data() ?? {};
  const oldVal = data.ammoNotificationRecipientUserId;
  const newVal = data.ammoNotificationRecipientUserIds;

  if (Array.isArray(newVal)) {
    console.log(
      `[migrate] Skip: ammoNotificationRecipientUserIds already present (length=${newVal.length}).`,
    );
    return;
  }

  let nextArray;
  if (typeof oldVal === 'string' && oldVal.trim().length > 0) {
    nextArray = [oldVal.trim()];
  } else {
    nextArray = [];
  }

  const updates = {
    ammoNotificationRecipientUserIds: nextArray,
    ammoNotificationRecipientUserId: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (dryRun) {
    console.log('[migrate] [dry-run] would write:', {
      ammoNotificationRecipientUserIds: nextArray,
      ammoNotificationRecipientUserId: '<DELETE>',
    });
    return;
  }

  await ref.set(updates, { merge: true });
  console.log(
    `[migrate] Done. ammoNotificationRecipientUserIds = ${JSON.stringify(nextArray)}; old field removed.`,
  );
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
