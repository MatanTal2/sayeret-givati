import { auth } from './firebase';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function generateIdempotencyKey(): string {
  // crypto.randomUUID is available in Node 19+ and all modern browsers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Authenticated fetch wrapper. Attaches the current user's Firebase ID token
 * as `Authorization: Bearer <token>`. Use for every call to a protected
 * `/api/...` route. Public auth routes (`/api/auth/register`,
 * `/api/auth/verify-military-id`, `/api/auth/check-email-verified`) use plain
 * `fetch` instead.
 *
 * Mutating methods (POST/PUT/PATCH/DELETE) automatically receive an
 * `Idempotency-Key` header (UUID v4) so server-side `withIdempotency` can
 * dedupe replays. Callers can override by setting the header themselves
 * (e.g. the outbox replay loop reuses the original key on retry).
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
  const method = (init.method ?? 'GET').toUpperCase();
  if (MUTATING_METHODS.has(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', generateIdempotencyKey());
  }
  return fetch(input, { ...init, headers });
}
