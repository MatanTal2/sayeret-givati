'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  listForUid,
  removeById,
  subscribe as subscribeOutbox,
  updateById,
  type OutboxEntry,
} from '@/lib/offline/outbox';
import { drainOutbox, installAutoDrain } from '@/lib/offline/replay';

export type ConflictResolution = 'keep' | 'discard';

interface OutboxContextValue {
  entries: OutboxEntry[];
  pendingCount: number;
  conflictCount: number;
  stuckCount: number;
  /** Manually trigger a drain pass — useful for "retry now" buttons. */
  drain: () => Promise<void>;
  /**
   * Resolve a queued conflict.
   *  - `keep`: rewrite `If-Match` to the latest server version (from
   *    conflictState.serverData) and set status back to pending so the
   *    replay loop sends it again on the next tick.
   *  - `discard`: remove the entry; user accepts the server state.
   */
  resolveConflict: (id: number, resolution: ConflictResolution) => Promise<void>;
}

const OutboxContext = createContext<OutboxContextValue | undefined>(undefined);

export function OutboxProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !uid) {
      setEntries([]);
      return;
    }
    let mounted = true;

    const refresh = async () => {
      try {
        const list = await listForUid(uid);
        if (mounted) setEntries(list);
      } catch (e) {
        console.warn('[outbox-context] refresh failed', e);
      }
    };

    void refresh();
    const unsub = subscribeOutbox(() => { void refresh(); });
    installAutoDrain();

    return () => {
      mounted = false;
      unsub();
    };
  }, [uid]);

  const value = useMemo<OutboxContextValue>(() => {
    const pendingCount = entries.filter((e) => e.status === 'pending' || e.status === 'awaiting_auth' || e.status === 'replaying').length;
    const conflictCount = entries.filter((e) => e.status === 'conflict').length;
    const stuckCount = entries.filter((e) => e.status === 'stuck' || e.status === 'poisoned').length;
    return {
      entries,
      pendingCount,
      conflictCount,
      stuckCount,
      drain: async () => { await drainOutbox(); },
      resolveConflict: async (id, resolution) => {
        if (resolution === 'discard') {
          await removeById(id);
          return;
        }
        // keep — reset to pending; if the server's 409 body carried an
        // updatedAt-like field, lift it into If-Match so the next send
        // wins.
        const target = entries.find((e) => e.id === id);
        const headers = { ...(target?.headers ?? {}) };
        const sd = (target?.conflictState?.serverData ?? null) as
          | { newUpdatedAt?: string; updatedAt?: string }
          | null;
        const newIfMatch = sd?.newUpdatedAt ?? sd?.updatedAt;
        if (newIfMatch) headers['If-Match'] = newIfMatch;
        await updateById(id, {
          status: 'pending',
          headers,
          conflictState: undefined,
          nextAttemptAt: Date.now(),
        });
        void drainOutbox();
      },
    };
  }, [entries]);

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export function useOutbox(): OutboxContextValue {
  const ctx = useContext(OutboxContext);
  if (!ctx) {
    // Return a safe empty value when used outside the provider (e.g. SSR before mount).
    return {
      entries: [],
      pendingCount: 0,
      conflictCount: 0,
      stuckCount: 0,
      drain: async () => {},
      resolveConflict: async () => {},
    };
  }
  return ctx;
}
