# phoneBookService (server)

**File:** `src/lib/db/server/phoneBookService.ts`
**Status:** Active (Phase 1 — Phone Book).

## Purpose

Best-effort write-through for the `phoneBook` directory. Every change to
a `users` row or an `authorized_personnel` row that touches a
phone-relevant field calls into this module so the directory stays in
sync.

## Exports

- `serverUpsertPhoneBookFromUser(input)` — called from
  `/api/auth/register` and `/api/users/profile` (PATCH). Doc id =
  `militaryPersonalNumberHash`. Sets `source='users'`,
  `isRegistered=true`, denormalizes display name, photo URL, team id,
  and userType.
- `serverUpsertPhoneBookFromPersonnel(input)` — called from the
  `/api/authorized-personnel` POST/PUT/bulk handlers. Doc id =
  `militaryPersonalNumberHash`. Defensive: never downgrades a doc that
  is already `source='users'` back to personnel.
- `serverDeletePhoneBookEntryByHash(hash)` — called from the
  authorized-personnel DELETE handler. Skips entries that have a
  `userId` (registered users keep their entry until the underlying
  `users` row is removed).

## Failure mode

Every export wraps its body in a try/catch and logs to `console.error`.
The phone book is downstream — a sync hiccup must never block the
primary write (registration, profile update, personnel CRUD). If the
directory drifts, run `scripts/backfill-phone-book.ts` to reconcile.
