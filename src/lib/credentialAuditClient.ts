/**
 * Client wrapper for POST /api/auth/audit. Records a credential-change
 * event for the current user (or a target uid if elevated).
 *
 * Designed for fire-and-forget usage from client flows that have just
 * performed a credential-touching action (e.g. password change). Errors
 * are logged but not re-thrown — audit failure must not block the user's
 * primary action from completing.
 */

import { apiFetch } from '@/lib/apiFetch';
import type { CredentialAuditEntry, CredentialAuditEventType } from '@/types/credentialAudit';

interface LogArgs {
  uid: string;
  eventType: CredentialAuditEventType;
  metadata?: Record<string, unknown>;
}

export async function logCredentialAuditEvent(args: LogArgs): Promise<void> {
  try {
    const response = await apiFetch('/api/auth/audit', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    const result = await response.json();
    if (!result.success) {
      console.warn('[credentialAudit] server rejected entry:', result.error);
    }
  } catch (error) {
    console.warn('[credentialAudit] failed to log entry:', error);
  }
}

export type CredentialAuditEntryWithId = CredentialAuditEntry & { id: string };

interface FetchArgs {
  /** Defaults to the caller. Elevated actors may pass another uid. */
  uid?: string;
  /** Caps at 100 server-side. */
  limit?: number;
}

/**
 * Read the caller's credential audit log (or another uid's, if elevated).
 * Errors throw so the UI can surface a retry — unlike the write path,
 * which fires and forgets.
 */
export async function fetchCredentialAuditLog(
  args: FetchArgs = {},
): Promise<CredentialAuditEntryWithId[]> {
  const params = new URLSearchParams();
  if (args.uid) params.set('uid', args.uid);
  if (args.limit !== undefined) params.set('limit', String(args.limit));
  const qs = params.toString();
  const response = await apiFetch(`/api/auth/audit${qs ? `?${qs}` : ''}`);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error ?? 'Failed to load account activity');
  }
  return (result.entries ?? []) as CredentialAuditEntryWithId[];
}
