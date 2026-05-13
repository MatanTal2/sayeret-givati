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
import { FieldValue } from 'firebase-admin/firestore';
import type { CredentialAuditEntry, CredentialAuditEventType } from '@/types/credentialAudit';

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
