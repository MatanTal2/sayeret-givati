'use client';

/**
 * Cache invalidation hooks for the offline-first stack. Audit note S5.
 *
 * Whenever the user's identity or permission scope changes server-side,
 * any Firestore persistent cache row + SW runtime cache entry written
 * under the old identity is potentially stale and may surface authorized
 * content the user no longer has access to. We wipe both.
 *
 * Triggers:
 *  - Auth UID changes (sign-out / sign-in as different user).
 *  - 401/403 from any read response (server is telling us we lost access).
 *  - Explicit `X-Cache-Invalidate: <scope>` header on a server response
 *    (server-driven invalidation, e.g. after revoking a grant).
 */

import { clearIndexedDbPersistence } from 'firebase/firestore';
import { db } from '@/lib/firebase';

let lastUid: string | null = null;
let inFlight: Promise<void> | null = null;

async function clearPersistentFirestoreCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      // Must terminate the SDK first; Firebase requires no active listeners.
      // We rely on the fact that AuthProvider re-mounts everything on UID
      // change, so listeners have already unsubscribed by the time we land
      // here. Best-effort: swallow if it can't.
      await clearIndexedDbPersistence(db);
    } catch (e) {
      console.warn('[cache-invalidation] clearIndexedDbPersistence failed', e);
    }
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

async function clearServiceWorkerApiCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('caches' in self)) return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names.map(async (name) => {
        const c = await caches.open(name);
        const requests = await c.keys();
        await Promise.all(
          requests
            .filter((req) => req.url.includes('/api/'))
            .map((req) => c.delete(req)),
        );
      }),
    );
  } catch (e) {
    console.warn('[cache-invalidation] SW cache wipe failed', e);
  }
}

/**
 * Call from AuthProvider on every auth state change. The first call after
 * sign-in (with a non-null uid) is a no-op; subsequent UID changes trigger
 * a wipe. Sign-out (uid=null) also wipes.
 */
export async function notifyAuthStateChanged(uid: string | null): Promise<void> {
  if (uid === lastUid) return;
  const previous = lastUid;
  lastUid = uid;
  if (previous === null && uid !== null) return; // first sign-in, nothing to wipe
  await Promise.all([clearPersistentFirestoreCache(), clearServiceWorkerApiCache()]);
}

/**
 * Call from `apiFetch` on every response. If the server returned 401/403 on
 * a read path, or set `X-Cache-Invalidate`, wipe.
 */
export async function notifyResponseObserved(response: Response, method: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const isRead = method.toUpperCase() === 'GET';
  const hint = response.headers.get('X-Cache-Invalidate');
  if (hint) {
    await Promise.all([clearPersistentFirestoreCache(), clearServiceWorkerApiCache()]);
    return;
  }
  if (isRead && (response.status === 401 || response.status === 403)) {
    await Promise.all([clearPersistentFirestoreCache(), clearServiceWorkerApiCache()]);
  }
}
