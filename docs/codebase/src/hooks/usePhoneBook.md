# usePhoneBook

**File:** `src/hooks/usePhoneBook.ts`
**Status:** Active (Phase 1 — Phone Book).

## Purpose

Reads the `phoneBook` collection via the client SDK and exposes
`{ entries, isLoading, error, refresh }` to the page.

## Notes

- `useEffect` calls `refresh()` once on mount. `useCallback` deps are
  `[]` so the identity is stable. Do not regress this pattern — the
  recent infinite-loop bug in `useAmmunitionReports` came from a
  default-`{}` filter param breaking the same invariant.
- Reads are sorted by `displayName` — entries written via the
  write-through pipeline always have a non-empty `displayName`.
- Writes happen exclusively server-side (see
  `docs/spec/phone-book.md` for the trigger matrix).
