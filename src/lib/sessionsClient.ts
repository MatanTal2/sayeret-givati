/**
 * Client wrapper for session-management endpoints. Single export today:
 * `revokeOtherSessions` — bumps `users.sessionEpoch` for the caller so
 * every other device whose token pre-dates the fence is rejected on its
 * next API hit. The calling device stays alive (its auth_time matches
 * the new epoch).
 *
 * Force the calling-side idToken to refresh after a successful response
 * via `auth.currentUser.getIdToken(true)` if the caller needs to keep
 * making authenticated requests immediately. (For the "Sign out other
 * devices" UI we just close the modal and trust the next request to
 * mint a fresh token before the fence hits.)
 */

import { apiFetch } from '@/lib/apiFetch';

interface RevokeResponse {
  success: boolean;
  sessionEpochMs?: number;
  error?: string;
}

export async function revokeOtherSessions(): Promise<RevokeResponse> {
  try {
    const response = await apiFetch('/api/users/sessions/revoke', {
      method: 'POST',
    });
    return (await response.json()) as RevokeResponse;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
