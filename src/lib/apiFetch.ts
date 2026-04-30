import { auth } from './firebase';

/**
 * Authenticated fetch wrapper. Attaches the current user's Firebase ID token
 * as `Authorization: Bearer <token>`. Use for every call to a protected
 * `/api/...` route. Public auth routes (`/api/auth/register`,
 * `/api/auth/verify-military-id`, `/api/auth/check-email-verified`) use plain
 * `fetch` instead.
 *
 * Throws `Error('Not authenticated')` if there is no signed-in user.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}
