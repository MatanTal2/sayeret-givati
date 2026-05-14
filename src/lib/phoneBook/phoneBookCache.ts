/**
 * Phone book localStorage cache.
 *
 * Stores the resolved directory + the most recent `updatedAt` seen so the hook
 * can serve cached rows on mount and follow up with a delta query
 * (`where('updatedAt', '>', lastSyncedAt)`) rather than re-fetching the whole
 * collection. New registrations are rare once authorized_personnel is stable,
 * so the steady-state cost drops to zero docs read on most page loads.
 *
 * Trade-offs:
 *  - Deletions on the server cannot be observed via delta sync (a deleted doc
 *    is not in the result set). The 90-day TTL and the manual refresh button
 *    are the escape hatches.
 *  - Schema version key in the storage prefix so a future field rename can
 *    invalidate every client's cache by bumping the version.
 */
import { Timestamp } from 'firebase/firestore';
import type { PhoneBookEntry } from '@/types/phoneBook';

const CACHE_KEY = 'phoneBookCache:v1';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

interface SerializedEntry extends Omit<PhoneBookEntry, 'createdAt' | 'updatedAt'> {
  createdAtMs: number;
  updatedAtMs: number;
}

interface CachePayload {
  entries: SerializedEntry[];
  lastSyncedAtMs: number;
  cachedAtMs: number;
}

export interface PhoneBookCacheRead {
  entries: PhoneBookEntry[];
  lastSyncedAtMs: number;
}

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function tsToMs(ts: PhoneBookEntry['updatedAt']): number {
  if (!ts) return 0;
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  // Fallback for plain { seconds, nanoseconds } payloads (e.g. from API JSON).
  const seconds = (ts as { seconds?: number }).seconds ?? 0;
  const nanoseconds = (ts as { nanoseconds?: number }).nanoseconds ?? 0;
  return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
}

function msToTs(ms: number) {
  return Timestamp.fromMillis(ms);
}

function serialize(entry: PhoneBookEntry): SerializedEntry {
  const { createdAt, updatedAt, ...rest } = entry;
  return {
    ...rest,
    createdAtMs: tsToMs(createdAt),
    updatedAtMs: tsToMs(updatedAt),
  };
}

function deserialize(entry: SerializedEntry): PhoneBookEntry {
  const { createdAtMs, updatedAtMs, ...rest } = entry;
  return {
    ...rest,
    createdAt: msToTs(createdAtMs),
    updatedAt: msToTs(updatedAtMs),
  } as PhoneBookEntry;
}

export function readPhoneBookCache(): PhoneBookCacheRead | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || !Array.isArray(parsed.entries) || typeof parsed.cachedAtMs !== 'number') {
      return null;
    }
    if (Date.now() - parsed.cachedAtMs > TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return {
      entries: parsed.entries.map(deserialize),
      lastSyncedAtMs: parsed.lastSyncedAtMs ?? 0,
    };
  } catch {
    return null;
  }
}

export function writePhoneBookCache(entries: PhoneBookEntry[], lastSyncedAtMs: number): void {
  if (!storageAvailable()) return;
  try {
    const payload: CachePayload = {
      entries: entries.map(serialize),
      lastSyncedAtMs,
      cachedAtMs: Date.now(),
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded — drop the cache and continue. Network path still works.
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {
      /* nothing to do */
    }
  }
}

export function clearPhoneBookCache(): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

/**
 * Merge a delta (newer) snapshot into an existing list by id. New entries are
 * appended; existing entries are replaced. Caller decides the final ordering.
 */
export function mergeDelta(
  base: PhoneBookEntry[],
  delta: PhoneBookEntry[]
): PhoneBookEntry[] {
  if (delta.length === 0) return base;
  const byId = new Map(base.map((e) => [e.id, e]));
  for (const e of delta) {
    byId.set(e.id, e);
  }
  return Array.from(byId.values());
}

/** Exposed for tests. */
export const PHONE_BOOK_CACHE_TTL_MS = TTL_MS;
export const PHONE_BOOK_CACHE_KEY = CACHE_KEY;
