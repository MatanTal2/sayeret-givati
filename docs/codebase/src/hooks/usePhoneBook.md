# usePhoneBook

**File:** `src/hooks/usePhoneBook.ts`
**Status:** Active (Phase 1 — Phone Book).

## Purpose

Reads the `phoneBook` collection via the client SDK and exposes
`{ entries, isLoading, isRefreshing, error, refresh }` to the page. Implements
a cache-first / stale-while-revalidate strategy backed by localStorage so the
directory paints instantly on reload and the steady-state network cost drops
to a single delta query — usually zero docs read — once authorized_personnel
is stable.

## Return shape

| Field | Description |
|-------|-------------|
| `entries` | Directory rows, sorted by `displayName` (string-locale). |
| `isLoading` | `true` only until the first batch of rows (cached or server) is on screen. |
| `isRefreshing` | `true` while a background delta sync or a force-refresh is in flight. UI uses this to spin the refresh icon. |
| `error` | Hebrew error string if the server fetch fails. Cached rows stay visible even on error. |
| `refresh()` | Force-discard the cache and re-fetch the full directory. Wired to the manual refresh button. |

## Cache strategy

1. **On mount** — read `phoneBookCache:v1` from localStorage.
   - **Cache hit:** seed `entries` from the cached payload (immediate paint),
     then issue `listPhoneBookEntriesUpdatedSince(lastSyncedAtMs)` and merge
     the result. New rows append; existing rows are replaced by id. Cache
     overwritten with the merged list + new high-water mark.
   - **Cache miss / expired:** issue `listPhoneBookEntries()` and write the
     full payload. TTL is 90 days (`PHONE_BOOK_CACHE_TTL_MS`).
2. **`refresh()`** — clears the cache, resets the high-water mark to 0, and
   re-runs the full fetch path. Used by the manual refresh button on
   `src/app/phone-book/page.tsx`.
3. **High-water mark** — derived as `max(updatedAt)` across the current list.
   Stored alongside the entries so the next mount only fetches strictly newer
   docs.

## Limits

- **Deletions are invisible to delta sync.** A doc removed on the server stays
  in the cached list until the 90-day TTL expires or the user clicks refresh.
  Phone-book deletions happen rarely (only via
  `serverDeletePhoneBookEntryByHash` when an unregistered personnel row is
  removed); the trade-off is intentional. Document this in product copy if a
  hard guarantee is ever needed.
- The delta query orders by `updatedAt`; the merged list is re-sorted by
  `displayName` client-side to keep the UI ordering stable.
- `useEffect` deps remain `[forceFullFetch]` with `forceFullFetch` wrapped in
  `useCallback([])`, so the identity is stable. Do not regress this pattern —
  the prior infinite-loop bug in `useAmmunitionReports` came from a
  default-`{}` filter param breaking the same invariant.

## Related files

- `src/lib/phoneBook/phoneBookCache.ts` — serialization, TTL, merge helper.
- `src/lib/phoneBook/phoneBookService.ts` — full and delta queries.
- `src/app/phone-book/page.tsx` — refresh button.
- Writes happen exclusively server-side (see `docs/spec/phone-book.md`).
