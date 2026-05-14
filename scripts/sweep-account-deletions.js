/**
 * Operator-callable hard-delete sweep for accounts past the 30-day
 * soft-delete retention window. Mirrors the server-side
 * `serverSweepAccountDeletions` flow but inits `firebase-admin` directly,
 * so it can run from a plain `node` invocation with no build step.
 *
 * Auth: reads `GOOGLE_SERVICE_ACCOUNT_JSON` and
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from `.env.local` (same vars the
 * Next.js runtime uses). The service-account value is auto-detected as
 * plain JSON or base64-encoded JSON.
 *
 * Usage:
 *   node scripts/sweep-account-deletions.js [--dry-run] [--limit N] [--uid <uid>]
 *
 * Flags:
 *   --dry-run    Skip Auth.deleteUser + Firestore writes; show candidate list only.
 *   --limit N    Cap candidates this run (default 25, clamp 1..100). Use `--limit 1` for a canary.
 *   --uid <uid>  Surgical mode — skip the query and target one user. Useful for
 *                manual cleanup or hitting a known test user before going wide.
 *
 * Order per uid (matches the route):
 *   1) re-check outstanding equipment/ammo (skip + log if non-zero)
 *   2) stamp `users/{uid}.deletionStartedAt` (resume sentinel)
 *   3) Auth.deleteUser (swallow auth/user-not-found)
 *   4) Firestore tombstone (deletedAt, PII scrub, displayName='Deleted User')
 *   5) Append `ACCOUNT_DELETED` row to credentialAuditLog
 */
const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const path = require('path');

const RETENTION_DAYS = 30;
const DEFAULT_LIMIT = 25;
const PROD_PROJECT_ID = 'sayeret-givati-1983';

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
    /* .env.local missing — fall through */
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

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const rawLimit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : DEFAULT_LIMIT;
const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT));
const uidIdx = args.indexOf('--uid');
const onlyUid = uidIdx >= 0 ? args[uidIdx + 1] : null;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local');
  process.exit(1);
}
if (projectId !== PROD_PROJECT_ID) {
  console.error(
    `[sweep-account-deletions] refused: project ${projectId} is not the prod project (${PROD_PROJECT_ID}). Aborting.`,
  );
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

admin.initializeApp({ credential: admin.credential.cert(saJson), projectId });
const db = admin.firestore();
const auth = admin.auth();

const COLLECTIONS = {
  USERS: 'users',
  EQUIPMENT: 'equipment',
  AMMUNITION: 'ammunition',
  AMMUNITION_INVENTORY: 'ammunitionInventory',
  TRANSFER_REQUESTS: 'transferRequests',
  CREDENTIAL_AUDIT_LOG: 'credentialAuditLog',
};

async function countOutstandingAssets(uid) {
  const [equipmentSnap, ammoSerialSnap, ammoInventorySnap, fromSnap, toSnap] =
    await Promise.all([
      db
        .collection(COLLECTIONS.EQUIPMENT)
        .where('currentHolderId', '==', uid)
        .where('status', '!=', 'retired')
        .get(),
      db
        .collection(COLLECTIONS.AMMUNITION)
        .where('currentHolderType', '==', 'USER')
        .where('currentHolderId', '==', uid)
        .get(),
      db
        .collection(COLLECTIONS.AMMUNITION_INVENTORY)
        .where('holderType', '==', 'USER')
        .where('holderId', '==', uid)
        .get(),
      db
        .collection(COLLECTIONS.TRANSFER_REQUESTS)
        .where('fromUserId', '==', uid)
        .where('status', '==', 'pending')
        .get(),
      db
        .collection(COLLECTIONS.TRANSFER_REQUESTS)
        .where('toUserId', '==', uid)
        .where('status', '==', 'pending')
        .get(),
    ]);
  return {
    equipmentCount: equipmentSnap.size,
    ammunitionUserHoldings: ammoSerialSnap.size + ammoInventorySnap.size,
    pendingTransferRequests: fromSnap.size + toSnap.size,
  };
}

async function loadCandidates() {
  if (onlyUid) {
    const snap = await db.collection(COLLECTIONS.USERS).doc(onlyUid).get();
    return snap.exists ? [{ uid: onlyUid, data: snap.data() }] : [];
  }
  const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = admin.firestore.Timestamp.fromMillis(cutoffMs);
  const snap = await db
    .collection(COLLECTIONS.USERS)
    .where('deletionRequestedAt', '<', cutoff)
    .limit(limit * 2)
    .get();
  return snap.docs.map((d) => ({ uid: d.id, data: d.data() }));
}

function tsToMs(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts === 'number') return ts;
  return null;
}

async function main() {
  const candidates = await loadCandidates();
  console.log(
    `[sweep] loaded ${candidates.length} candidate${candidates.length === 1 ? '' : 's'} (limit=${limit}, dryRun=${dryRun}${onlyUid ? `, onlyUid=${onlyUid}` : ''})`,
  );

  let examined = 0;
  let deleted = 0;
  let skipped = 0;
  const errors = [];
  const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const c of candidates) {
    if (deleted + skipped + errors.length >= limit) break;
    examined += 1;
    const requestedAtMs = tsToMs(c.data.deletionRequestedAt);
    if (!requestedAtMs) {
      skipped += 1;
      console.log(`[sweep] skip ${c.uid}: no_pending`);
      continue;
    }
    if (requestedAtMs >= cutoffMs) {
      skipped += 1;
      console.log(`[sweep] skip ${c.uid}: too_young (requested ${new Date(requestedAtMs).toISOString()})`);
      continue;
    }
    if (tsToMs(c.data.deletedAt) !== null) {
      skipped += 1;
      console.log(`[sweep] skip ${c.uid}: already_tombstoned`);
      continue;
    }

    let assets;
    try {
      assets = await countOutstandingAssets(c.uid);
    } catch (e) {
      errors.push({ uid: c.uid, reason: 'unknown', message: e.message });
      console.error(`[sweep] error ${c.uid}: asset-check failed — ${e.message}`);
      continue;
    }
    if (
      assets.equipmentCount > 0 ||
      assets.ammunitionUserHoldings > 0 ||
      assets.pendingTransferRequests > 0
    ) {
      skipped += 1;
      console.log(
        `[sweep] skip ${c.uid}: has_outstanding_assets (equipment=${assets.equipmentCount} ammo=${assets.ammunitionUserHoldings} transfers=${assets.pendingTransferRequests})`,
      );
      continue;
    }

    if (dryRun) {
      deleted += 1;
      console.log(`[sweep] WOULD DELETE ${c.uid} (age ${(Date.now() - requestedAtMs) / (1000 * 60 * 60 * 24) | 0}d)`);
      continue;
    }

    const userRef = db.collection(COLLECTIONS.USERS).doc(c.uid);
    try {
      await userRef.update({
        deletionStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      errors.push({ uid: c.uid, reason: 'firestore_write_failed', message: e.message });
      console.error(`[sweep] error ${c.uid}: failed to stamp deletionStartedAt — ${e.message}`);
      continue;
    }

    try {
      await auth.deleteUser(c.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log(`[sweep] note ${c.uid}: Auth user already gone (resume path)`);
      } else {
        errors.push({ uid: c.uid, reason: 'auth_delete_failed', message: e.message });
        console.error(`[sweep] error ${c.uid}: Auth.deleteUser failed — ${e.message}`);
        continue;
      }
    }

    try {
      await userRef.update({
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        displayName: 'Deleted User',
        firstName: admin.firestore.FieldValue.delete(),
        lastName: admin.firestore.FieldValue.delete(),
        email: null,
        phoneNumber: null,
        profileImage: admin.firestore.FieldValue.delete(),
        address: admin.firestore.FieldValue.delete(),
        communicationPreferences: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      errors.push({ uid: c.uid, reason: 'firestore_write_failed', message: e.message });
      console.error(`[sweep] error ${c.uid}: tombstone write failed — ${e.message}`);
      continue;
    }

    try {
      await db.collection(COLLECTIONS.CREDENTIAL_AUDIT_LOG).add({
        uid: c.uid,
        actorUid: 'system',
        actorUserType: 'SYSTEM',
        eventType: 'ACCOUNT_DELETED',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn(`[sweep] audit-write failed for ${c.uid} (non-fatal): ${e.message}`);
    }

    deleted += 1;
    console.log(`[sweep] DELETED ${c.uid}`);
  }

  console.log(
    `[sweep] done. examined=${examined} deleted=${deleted} skipped=${skipped} errors=${errors.length}${dryRun ? ' (dry-run)' : ''}`,
  );
  if (errors.length > 0) {
    console.log('[sweep] errors:', errors);
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error('sweep failed:', e);
  process.exit(1);
});
