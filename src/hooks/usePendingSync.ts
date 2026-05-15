'use client';

import { useMemo } from 'react';
import { useOutbox } from '@/contexts/OutboxContext';

/**
 * Narrow selector over `OutboxContext.pendingResourceKeys`. Returns whether
 * each provided resource key has an uncommitted outbox entry.
 *
 * Pattern (audit S9): list components own server data and don't want to
 * track local optimistic state per row. They pass the resource keys they
 * render through this hook and get back a `(key) => boolean` lookup.
 *
 * Example:
 * ```ts
 * const isPending = usePendingSync(equipment.map((e) => `equipment:${e.id}`));
 * // ...
 * {equipment.map((row) => (
 *   <li>{row.name} {isPending(`equipment:${row.id}`) && <SyncingBadge />}</li>
 * ))}
 * ```
 *
 * No-arg form returns a function that accepts any key — useful when the
 * caller can't enumerate keys up front.
 */
export function usePendingSync(keys?: readonly string[]): (key: string) => boolean {
  const { pendingResourceKeys } = useOutbox();
  return useMemo(() => {
    if (keys && keys.length > 0) {
      // Materialize a filtered Set so consumers don't pay the full-context
      // re-render on unrelated entries (resourceKeys for other domains).
      const filtered = new Set<string>();
      for (const k of keys) {
        if (pendingResourceKeys.has(k)) filtered.add(k);
      }
      return (key: string) => filtered.has(key);
    }
    return (key: string) => pendingResourceKeys.has(key);
  }, [keys, pendingResourceKeys]);
}
