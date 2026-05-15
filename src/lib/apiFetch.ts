import { auth } from './firebase';
import { enqueue } from './offline/outbox';
import { matchAllowlist } from './offline/allowlist';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function urlToPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input.startsWith('http') ? new URL(input).pathname : input;
  }
  if (input instanceof URL) return input.pathname;
  return urlToPath((input as Request).url);
}

/**
 * Authenticated fetch wrapper.
 *
 * Attaches `Authorization: Bearer <token>` for protected `/api/...` routes.
 * Public auth routes use plain `fetch`.
 *
 * Mutating methods (POST/PUT/PATCH/DELETE) receive an `Idempotency-Key`
 * header (UUID) unless the caller supplies one. The outbox replay loop
 * overrides with the originally-enqueued key on retry — that's how server
 * dedupe stays consistent across reconnect cycles.
 *
 * Offline + allowlisted: enqueues the request into the outbox and returns
 * a synthetic `202 Accepted` response (`{ success: true, queued: true }`).
 * Callers can treat this as success for optimistic UI; the real reply
 * arrives via outbox replay. Routes not on the allowlist throw — security
 * (auth, sessions, phone-change) and audit routes must never queue.
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
  const method = (init.method ?? 'GET').toUpperCase();
  const path = urlToPath(input);
  const headers = new Headers(init.headers);

  let idempotencyKey: string | null = null;
  if (MUTATING_METHODS.has(method)) {
    idempotencyKey = headers.get('Idempotency-Key') ?? generateIdempotencyKey();
    headers.set('Idempotency-Key', idempotencyKey);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Offline path — enqueue if route is allowlisted.
  if (typeof navigator !== 'undefined' && !navigator.onLine && MUTATING_METHODS.has(method)) {
    const match = matchAllowlist(method, path);
    if (match) {
      const body = typeof init.body === 'string' ? init.body : init.body ? await new Response(init.body).text() : '';
      const headerEntries = Object.fromEntries(headers.entries());
      delete headerEntries.authorization;
      delete headerEntries.Authorization;
      await enqueue({
        uid: user.uid,
        method,
        url: path,
        headers: headerEntries,
        body,
        idempotencyKey: idempotencyKey!,
        routeName: match.routeName,
        ...(match.resourceKey ? { resourceKey: match.resourceKey } : {}),
      });
      return new Response(
        JSON.stringify({ success: true, queued: true, idempotencyKey }),
        { status: 202, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Non-allowlisted offline mutation → let fetch fail loudly. The caller
    // should surface the network error to the user.
  }

  const idToken = await user.getIdToken();
  headers.set('Authorization', `Bearer ${idToken}`);
  return fetch(input, { ...init, headers });
}
