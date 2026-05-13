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
import type { CredentialAuditEventType } from '@/types/credentialAudit';

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
