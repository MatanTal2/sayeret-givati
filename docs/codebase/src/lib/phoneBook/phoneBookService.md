# phoneBookService.ts (client reads)

**File:** `src/lib/phoneBook/phoneBookService.ts`
**Status:** Active

## Purpose

Client SDK reads against the `phoneBook` collection. Writes are server-only
(see `src/lib/db/server/phoneBookService.ts`).

## Exports

| Function | Description |
|----------|-------------|
| `listPhoneBookEntries()` | Full collection ordered by `displayName`. Used on cold cache and on manual refresh. |
| `listPhoneBookEntriesUpdatedSince(sinceMs)` | Delta read: every doc with `updatedAt > sinceMs`, ordered by `updatedAt`. Used by `usePhoneBook` after a cache hit. |

## Indexing

The delta query uses `where('updatedAt', '>', ts) + orderBy('updatedAt')` —
single-field inequality, so no composite index is required. The full query
orders by `displayName` alone, also single-field.

## Related

- `src/hooks/usePhoneBook.ts` — cache-aware caller.
- `src/lib/phoneBook/phoneBookCache.ts` — TTL + delta merge.
