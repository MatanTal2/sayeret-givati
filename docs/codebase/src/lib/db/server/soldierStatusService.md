# db/server/soldierStatusService.ts

**File:** `src/lib/db/server/soldierStatusService.ts`
**Status:** Active

## Purpose

Server-side persistence and read-side join for the soldier status feature.
Replaces the legacy Google-Sheets-backed `/api/sheets` route. The doc id of
every `soldierStatus/{id}` is the soldier's `militaryPersonalNumberHash` —
the same hash used as the doc id of `authorized_personnel/{hash}` and stored
on `users.militaryPersonalNumberHash`. That makes the roster join a direct
doc-id lookup, no extra index needed.

## Exports

| Export | Purpose |
|--------|---------|
| `serverListRoster()` | Joins `users` ∪ `authorized_personnel`, deduplicates by hash (preferring `users` for display fields), and overlays each soldier's current status. Sorted by Hebrew full name. |
| `serverUpdateSoldierStatus(hashedId, input)` | Upserts `soldierStatus/{hashedId}`. Validates the status enum, the `customStatus` presence rule, and that the hashed id matches at least one row in `users` or `authorized_personnel`. |
| `SoldierStatusValidationError` | Named error with `status` (400 or 404) for API routes to map cleanly. |

## Firebase Operations

- `soldierStatus/{hash}` — `set({ ..., merge: true })` on each PUT. Reads are
  full-collection scans during `serverListRoster` (small roster, single sayeret).
- `authorized_personnel/{hash}` — read-only (existence check + roster source).
- `users` — read-only (roster source, joined by `militaryPersonalNumberHash`).

## Doc shape

```
soldierStatus/{militaryPersonalNumberHash}
  status: 'בית' | 'משמר' | 'אחר'
  customStatus?: string   // present iff status === 'אחר'
  updatedAt: Timestamp    // server timestamp
```

Audit fields (`updatedBy`, `updatedByName`) and per-soldier history are
intentionally deferred — see project memory `project_status_route_migration`
and the deferred-follow-ups section of the migration plan.

## Validation rules baked into `serverUpdateSoldierStatus`

- `id` is required (non-empty string).
- `status` must be one of `בית`, `משמר`, `אחר`.
- `status === 'אחר'` requires non-empty `customStatus`; the trimmed string is
  persisted.
- `status !== 'אחר'` strips any stale `customStatus` via `FieldValue.delete()`,
  so toggling away from `אחר` cannot leave dangling custom labels.
- The hashed id must match `authorized_personnel/{id}` OR a `users` row with
  `militaryPersonalNumberHash == id`. Otherwise rejected as `404` to prevent
  orphan status docs.

## Roster join

`serverListRoster` is intentionally an in-memory three-collection read:

1. Seed rows from `authorized_personnel` (firstName, lastName, default platoon).
2. Override / add rows from `users`, preferring user-side firstName/lastName/teamId.
3. Apply each soldier's `soldierStatus` overlay — status, customStatus, updatedAt.

Defaults:
- Missing `teamId` on the user → `'מסייעת'` (matches the legacy sheet default).
- Missing `soldierStatus` doc → `status: 'בית'`.

## Notes

- The roster is small (single sayeret). When the size grows past a few hundred,
  revisit the full-collection read in `serverListRoster`.
- Doc-id is hash, not raw personnel number — by design. The raw personnel
  number is never stored in the system after registration, so the migration
  drops the old "include personnel number in report" feature on `/status`.
- Backfill is run via `scripts/migrate-soldier-status.ts` (CSV → Firestore).
