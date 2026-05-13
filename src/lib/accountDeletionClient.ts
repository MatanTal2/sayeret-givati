/**
 * Client wrapper for the account-deletion API. Two calls:
 *   requestAccountDeletion(reason?) → soft-delete request, optional reason.
 *   cancelAccountDeletion()          → undo within the retention window.
 */
import { apiFetch } from '@/lib/apiFetch';
import type { OutstandingAssets } from '@/types/accountDeletion';

export interface RequestDeleteResult {
  success: boolean;
  /** Stable code for UI branching without parsing the message. */
  code?: 'has_outstanding_assets' | 'already_requested' | 'unauthorized' | 'unknown';
  outstanding?: OutstandingAssets;
}

export interface CancelDeleteResult {
  success: boolean;
  code?: 'no_pending_request' | 'unauthorized' | 'unknown';
}

export async function requestAccountDeletion(reason?: string): Promise<RequestDeleteResult> {
  const res = await apiFetch('/api/users/account/delete', {
    method: 'POST',
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.success) return { success: true };
  if (res.status === 401 || res.status === 403) return { success: false, code: 'unauthorized' };
  if (data?.code === 'has_outstanding_assets') {
    return { success: false, code: 'has_outstanding_assets', outstanding: data.outstanding };
  }
  if (data?.code === 'already_requested') return { success: false, code: 'already_requested' };
  return { success: false, code: 'unknown' };
}

export async function cancelAccountDeletion(): Promise<CancelDeleteResult> {
  const res = await apiFetch('/api/users/account/cancel-delete', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.success) return { success: true };
  if (res.status === 401 || res.status === 403) return { success: false, code: 'unauthorized' };
  if (data?.code === 'no_pending_request') return { success: false, code: 'no_pending_request' };
  return { success: false, code: 'unknown' };
}
