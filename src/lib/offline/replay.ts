'use client';

/**
 * Offline replay loop. Drains the outbox when the browser is online and an
 * authenticated user is present.
 *
 * Design notes (see docs/spec/offline-first.md):
 * - M6: await `onAuthStateChanged` once before deciding `awaiting_auth` vs
 *   `replay`. Avoids racing the auth-restore on cold load.
 * - S3: concurrency cap from `OFFLINE_REPLAY_CONCURRENCY`. Per-batch token
 *   cache (fetch one ID token, reuse for every entry in the batch).
 * - M3: chained `If-Match` rewriting handled in the per-entry replay path —
 *   on 200 we record the new resource version and rewrite the next entry on
 *   the same `resourceKey` before sending.
 * - M7: this is the canonical replay path. Service-worker `sync` event is
 *   an optimization layered on top in `src/app/sw.ts`; iOS falls back here.
 * - Backoff state machine in docs/spec/offline-first.md.
 */

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  OFFLINE_REPLAY_CONCURRENCY,
} from '@/lib/offline/config';
import {
  listPendingForUid,
  updateById,
  removeById,
  findNextOnResource,
  type OutboxEntry,
} from '@/lib/offline/outbox';

const BACKOFF_STEPS_MS = [1_000, 4_000, 16_000, 64_000, 5 * 60_000];
const STUCK_AFTER_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
  return BACKOFF_STEPS_MS[Math.min(attempts, BACKOFF_STEPS_MS.length - 1)];
}

async function waitForAuthSettled(): Promise<{ uid: string; token: string } | null> {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { uid: auth.currentUser.uid, token };
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        resolve(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        resolve({ uid: user.uid, token });
      } catch {
        resolve(null);
      }
    });
  });
}

async function sendEntry(entry: OutboxEntry, token: string, signal: AbortSignal): Promise<Response> {
  const headers = new Headers(entry.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && entry.body) headers.set('Content-Type', 'application/json');
  headers.set('Idempotency-Key', entry.idempotencyKey);
  return fetch(entry.url, {
    method: entry.method,
    headers,
    body: entry.body || undefined,
    signal,
  });
}

interface ReplayResult {
  drained: number;
  conflicts: number;
  failures: number;
  stuck: number;
  poisoned: number;
}

let running = false;
let scheduledAgain = false;

export async function drainOutbox(signal?: AbortSignal): Promise<ReplayResult | null> {
  if (typeof window === 'undefined') return null;
  if (!navigator.onLine) return null;

  if (running) {
    scheduledAgain = true;
    return null;
  }
  running = true;

  const result: ReplayResult = { drained: 0, conflicts: 0, failures: 0, stuck: 0, poisoned: 0 };

  try {
    const auth = await waitForAuthSettled();
    if (!auth) return result;
    const { uid, token } = auth;

    const concurrency = OFFLINE_REPLAY_CONCURRENCY;
    let pending = await listPendingForUid(uid);
    while (pending.length > 0) {
      const batch = pending.slice(0, concurrency);
      await Promise.all(batch.map((entry) => processEntry(entry, token, signal, result, uid)));
      pending = await listPendingForUid(uid);
    }

    return result;
  } finally {
    running = false;
    if (scheduledAgain) {
      scheduledAgain = false;
      // Re-arm after current microtask completes; another listener may have added entries while we drained.
      setTimeout(() => { void drainOutbox(); }, 0);
    }
  }
}

async function processEntry(
  entry: OutboxEntry,
  token: string,
  signal: AbortSignal | undefined,
  result: ReplayResult,
  uid: string,
): Promise<void> {
  if (entry.id === undefined) return;
  await updateById(entry.id, { status: 'replaying', attempts: entry.attempts + 1 });

  try {
    const ac = new AbortController();
    if (signal) signal.addEventListener('abort', () => ac.abort(), { once: true });

    const res = await sendEntry(entry, token, ac.signal);
    if (res.status >= 200 && res.status < 300) {
      const newUpdatedAt = await extractUpdatedAt(res);
      if (newUpdatedAt && entry.resourceKey) {
        await rewriteNextOnResource(uid, entry.resourceKey, entry.id, newUpdatedAt);
      }
      await removeById(entry.id);
      result.drained++;
      return;
    }
    if (res.status === 401) {
      await updateById(entry.id, { status: 'awaiting_auth', lastError: 'unauthorized' });
      return;
    }
    if (res.status === 409) {
      const serverData = await safeJson(res);
      await updateById(entry.id, {
        status: 'conflict',
        lastError: 'version conflict',
        conflictState: { detectedAt: Date.now(), serverData },
      });
      result.conflicts++;
      return;
    }
    if (res.status === 422) {
      const errJson = await safeJson(res) as { code?: string } | null;
      if (errJson?.code === 'IDEMPOTENCY_KEY_REUSED') {
        await updateById(entry.id, { status: 'poisoned', lastError: 'idempotency_key_reused' });
        result.poisoned++;
        return;
      }
      // Other 422s — treat as terminal validation failure.
      await updateById(entry.id, { status: 'poisoned', lastError: `validation: ${res.status}` });
      result.poisoned++;
      return;
    }
    // 4xx other than the above → terminal client error; poison so user can inspect.
    if (res.status >= 400 && res.status < 500) {
      await updateById(entry.id, { status: 'poisoned', lastError: `client_error: ${res.status}` });
      result.poisoned++;
      return;
    }
    // 5xx — backoff.
    await markBackoff(entry, `server_error: ${res.status}`, result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await markBackoff(entry, `network_error: ${msg}`, result);
  }
}

async function markBackoff(entry: OutboxEntry, error: string, result: ReplayResult): Promise<void> {
  if (entry.id === undefined) return;
  const nextAttempts = entry.attempts + 1;
  if (nextAttempts >= STUCK_AFTER_ATTEMPTS) {
    await updateById(entry.id, { status: 'stuck', lastError: error });
    result.stuck++;
    return;
  }
  await updateById(entry.id, {
    status: 'pending',
    lastError: error,
    nextAttemptAt: Date.now() + backoffMs(nextAttempts),
  });
  result.failures++;
}

async function safeJson(res: Response): Promise<unknown> {
  try { return await res.json(); } catch { return null; }
}

async function extractUpdatedAt(res: Response): Promise<string | null> {
  const clone = res.clone();
  const json = (await safeJson(clone)) as { newUpdatedAt?: string; updatedAt?: string } | null;
  return json?.newUpdatedAt ?? json?.updatedAt ?? null;
}

async function rewriteNextOnResource(
  uid: string,
  resourceKey: string,
  afterId: number,
  newUpdatedAt: string,
): Promise<void> {
  const next = await findNextOnResource(uid, resourceKey, afterId);
  if (!next || next.id === undefined) return;
  const headers = { ...next.headers, 'If-Match': newUpdatedAt };
  await updateById(next.id, { headers });
}

/**
 * Wire window-level events that should trigger a drain. Idempotent — safe to
 * call multiple times; subsequent calls are no-ops.
 */
let installed = false;
export function installAutoDrain(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  const trigger = () => { void drainOutbox(); };
  window.addEventListener('online', trigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger();
  });
  // First tick (M6 handles auth-restore inside).
  trigger();
}
