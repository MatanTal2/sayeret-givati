/**
 * Server-side service for the credential audit log.
 *
 * All writes go through `writeCredentialAuditEvent`. Reads are restricted
 * to admin / SYSTEM_MANAGER via `listCredentialAuditForUser`. Firestore
 * rules deny ALL client access to the underlying collection — every
 * read/write must come through this service via an API route.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CredentialAuditEntry, CredentialAuditEventType } from '@/types/credentialAudit';

/**
 * Council answer Q5=a — `credentialAuditLog` retains 1 year.
 *
 * Exposed as a constant so the cron route, the manual script, and tests can
 * all agree on the window. Override via the `?ageDays=` query in the cron
 * route or `--age-days` on `scripts/purge-credential-audit-log.js`.
 */
export const CREDENTIAL_AUDIT_RETENTION_DAYS = 365;

interface WriteArgs {
  uid: string;
  actorUid: string;
  actorUserType: string;
  eventType: CredentialAuditEventType;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append a single credential-change event. Document ID is auto-generated;
 * the entry is append-only — there is no update or delete path on this
 * collection from any code in this codebase.
 */
export async function writeCredentialAuditEvent(args: WriteArgs): Promise<string> {
  const db = getAdminDb();
  const entry: Record<string, unknown> = {
    uid: args.uid,
    actorUid: args.actorUid,
    actorUserType: args.actorUserType,
    eventType: args.eventType,
    timestamp: FieldValue.serverTimestamp(),
  };
  if (args.ip) entry.ip = args.ip;
  if (args.userAgent) entry.userAgent = args.userAgent;
  if (args.metadata && Object.keys(args.metadata).length > 0) entry.metadata = args.metadata;

  const ref = await db.collection(COLLECTIONS.CREDENTIAL_AUDIT_LOG).add(entry);
  return ref.id;
}

/**
 * Fetch the most recent N credential-audit entries for a single target uid,
 * newest first. Caller must be elevated (enforced at the API-route layer,
 * not here — service trusts its caller).
 */
export async function listCredentialAuditForUser(
  uid: string,
  limit = 50,
): Promise<Array<CredentialAuditEntry & { id: string }>> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.CREDENTIAL_AUDIT_LOG)
    .where('uid', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CredentialAuditEntry) }));
}

export interface PurgeOptions {
  /** Retention window in days. Entries older than this are deleted. */
  ageDays?: number;
  /** Skip writes; log planned deletions only. */
  dryRun?: boolean;
  /**
   * Hard cap on total deletes per invocation. Vercel cron tasks have a 60s
   * default budget, so this stops one tick from running away on a backfill.
   * Anything remaining rolls into the next scheduled run.
   */
  maxDeletes?: number;
  /** Inject a clock for tests. */
  now?: Date;
}

export interface PurgeResult {
  examined: number;
  deleted: number;
  failed: number;
  dryRun: boolean;
  ageDays: number;
  cutoff: string;
  durationMs: number;
  truncated: boolean;
}

const DEFAULT_MAX_DELETES = 5000;
const PAGE_SIZE = 500;

/**
 * Page through `credentialAuditLog` deleting any entry older than the
 * retention cutoff. Mirrors `scripts/purge-credential-audit-log.js` so the
 * manual operator path and the scheduled cron stay byte-for-byte aligned.
 *
 * Resumable + idempotent: deletes by document reference in 500-doc batches
 * (Firestore's commit limit). A partial run aborts cleanly — the next tick
 * picks up at the same cutoff and finds the remaining stragglers.
 */
export async function serverPurgeCredentialAuditLog(
  opts: PurgeOptions = {},
): Promise<PurgeResult> {
  const startedAtMs = Date.now();
  const ageDays = opts.ageDays ?? CREDENTIAL_AUDIT_RETENTION_DAYS;
  const dryRun = !!opts.dryRun;
  const maxDeletes = opts.maxDeletes ?? DEFAULT_MAX_DELETES;
  const now = opts.now ?? new Date();
  const cutoffMs = now.getTime() - ageDays * 24 * 60 * 60 * 1000;
  const cutoffTs = Timestamp.fromMillis(cutoffMs);

  const db = getAdminDb();
  let deleted = 0;
  let failed = 0;
  let examined = 0;
  let truncated = false;

  // Iterate pages until either the query is empty or we hit the per-tick cap.
  // No startAfter cursor needed: every iteration deletes the entries it saw,
  // so the next `< cutoff` query returns the next page automatically.
  while (deleted + failed < maxDeletes) {
    const remaining = maxDeletes - (deleted + failed);
    const pageSize = Math.min(PAGE_SIZE, remaining);
    const snap = await db
      .collection(COLLECTIONS.CREDENTIAL_AUDIT_LOG)
      .where('timestamp', '<', cutoffTs)
      .orderBy('timestamp', 'asc')
      .limit(pageSize)
      .get();
    if (snap.empty) break;
    examined += snap.size;

    if (dryRun) {
      deleted += snap.size;
      continue;
    }

    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    try {
      await batch.commit();
      deleted += snap.size;
    } catch (e) {
      failed += snap.size;
      console.error(
        '[credentialAuditLog/purge] batch delete failed:',
        e instanceof Error ? e.message : String(e),
      );
      // A batch failure is non-fatal — bail out so we don't spin retrying
      // the same broken page. Next tick will hit it again.
      break;
    }
  }

  if (deleted + failed >= maxDeletes) truncated = true;

  return {
    examined,
    deleted,
    failed,
    dryRun,
    ageDays,
    cutoff: new Date(cutoffMs).toISOString(),
    durationMs: Date.now() - startedAtMs,
    truncated,
  };
}
