# phoneBookCache.ts

**File:** `src/lib/phoneBook/phoneBookCache.ts`
**Status:** Active

## Purpose

localStorage cache for the phone book directory. Powers the
stale-while-revalidate strategy in `usePhoneBook` — on mount the hook paints
the cached rows immediately, then issues a delta query
(`where('updatedAt', '>', lastSyncedAt)`) instead of refetching the full
collection. Once authorized_personnel is stable, the steady-state cost of
opening the phone book is one empty query result.

## Storage shape

| Key | Value |
|-----|-------|
| `phoneBookCache:v1` | `{ entries: SerializedEntry[], lastSyncedAtMs: number, cachedAtMs: number }` JSON-stringified. |

`SerializedEntry` is `PhoneBookEntry` with the two Firestore `Timestamp`
fields (`createdAt`, `updatedAt`) replaced by `createdAtMs` / `updatedAtMs`
numbers — `localStorage` only stores strings. On read the cache rebuilds the
Timestamps via `Timestamp.fromMillis()` so callers receive the original
shape.

## TTL

90 days (`PHONE_BOOK_CACHE_TTL_MS`). Rationale: new registrations are rare
after the authorized personnel roster is stable, but phone numbers do
change. Two escape hatches:

1. **Delta sync on every mount** — picks up edits within milliseconds.
2. **Manual refresh button** — wired in `src/app/phone-book/page.tsx` via
   `usePhoneBook().refresh()`. Clears the cache and re-fetches the full
   directory.

## Exports

| Export | Description |
|--------|-------------|
| `readPhoneBookCache()` | Returns `{ entries, lastSyncedAtMs }` or `null` if missing / expired / malformed. Self-cleans expired payloads. |
| `writePhoneBookCache(entries, lastSyncedAtMs)` | Serializes and stores. Swallows quota errors (and clears the key if persistence fails). |
| `clearPhoneBookCache()` | Removes the entry. Called from `refresh()`. |
| `mergeDelta(base, delta)` | Pure helper. Merges a delta list into the existing list by `id`; delta entries win. Returns the same array reference if delta is empty. |
| `PHONE_BOOK_CACHE_KEY`, `PHONE_BOOK_CACHE_TTL_MS` | Exposed for tests. |

## Known limits

- **Deletions are invisible to delta sync.** A doc removed on the server is
  not in the result of a `where('updatedAt', '>', ts)` query, so the cache
  keeps the stale row until the TTL expires or the user hits refresh. Phone
  book deletions only fire for never-registered personnel rows
  (`serverDeletePhoneBookEntryByHash`); the trade-off is intentional.
- **Schema migrations** require bumping the storage key (`:v1` → `:v2`) so
  every client invalidates on the next mount.

## Related files

- `src/hooks/usePhoneBook.ts` — orchestrates cache + delta + refresh.
- `src/lib/phoneBook/phoneBookService.ts` — `listPhoneBookEntries` (full) and
  `listPhoneBookEntriesUpdatedSince(sinceMs)` (delta).
