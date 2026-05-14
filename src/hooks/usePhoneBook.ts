'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listPhoneBookEntries,
  listPhoneBookEntriesUpdatedSince,
} from '@/lib/phoneBook/phoneBookService';
import {
  readPhoneBookCache,
  writePhoneBookCache,
  clearPhoneBookCache,
  mergeDelta,
} from '@/lib/phoneBook/phoneBookCache';
import type { PhoneBookEntry } from '@/types/phoneBook';

export interface UsePhoneBookReturn {
  entries: PhoneBookEntry[];
  isLoading: boolean;
  /** True while a background revalidation (delta sync) is in flight. */
  isRefreshing: boolean;
  error: string | null;
  /** Force-reload the full directory and overwrite the cache. */
  refresh: () => Promise<void>;
}

/** Largest `updatedAt` (ms) across the entry list — used for the next delta query. */
function highWaterMark(entries: PhoneBookEntry[]): number {
  let max = 0;
  for (const e of entries) {
    const ts = e.updatedAt as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    let ms = 0;
    if (typeof ts?.toMillis === 'function') ms = ts.toMillis();
    else if (typeof ts?.seconds === 'number') ms = ts.seconds * 1000;
    if (ms > max) max = ms;
  }
  return max;
}

function sortByDisplayName(entries: PhoneBookEntry[]): PhoneBookEntry[] {
  return [...entries].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function usePhoneBook(): UsePhoneBookReturn {
  const [entries, setEntries] = useState<PhoneBookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Latest `updatedAt` we've observed across mounts. Lives in a ref so the
  // delta sync can use the value without forcing extra renders.
  const lastSyncedAtRef = useRef<number>(0);

  const forceFullFetch = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const list = await listPhoneBookEntries();
      const sorted = sortByDisplayName(list);
      setEntries(sorted);
      const hwm = highWaterMark(sorted);
      lastSyncedAtRef.current = hwm;
      writePhoneBookCache(sorted, hwm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת ספר טלפונים');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    clearPhoneBookCache();
    lastSyncedAtRef.current = 0;
    setIsLoading(true);
    await forceFullFetch();
  }, [forceFullFetch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = readPhoneBookCache();
      if (cached && cached.entries.length > 0) {
        // Paint immediately, then revalidate via a delta query.
        const seeded = sortByDisplayName(cached.entries);
        if (!cancelled) {
          setEntries(seeded);
          setIsLoading(false);
          lastSyncedAtRef.current = cached.lastSyncedAtMs;
        }
        setIsRefreshing(true);
        try {
          const delta = await listPhoneBookEntriesUpdatedSince(cached.lastSyncedAtMs);
          if (cancelled) return;
          if (delta.length === 0) {
            // Nothing changed — leave the cache `cachedAtMs` stale (will TTL out
            // eventually) but the data is still correct.
            setIsRefreshing(false);
            return;
          }
          const merged = sortByDisplayName(mergeDelta(seeded, delta));
          setEntries(merged);
          const hwm = highWaterMark(merged);
          lastSyncedAtRef.current = hwm;
          writePhoneBookCache(merged, hwm);
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'שגיאה בטעינת ספר טלפונים');
          }
        } finally {
          if (!cancelled) setIsRefreshing(false);
        }
      } else {
        await forceFullFetch();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forceFullFetch]);

  return { entries, isLoading, isRefreshing, error, refresh };
}
