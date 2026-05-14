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
| `serverUpdateSoldierStatus(hashedId, input, actor?)` | Upserts `soldierStatus/{hashedId}`. Validates the status enum, the `customStatus` presence rule, and that the hashed id matches at least one row in `users` or `authorized_personnel`. When `actor` is supplied, also stamps audit fields and appends a row to the `history` subcollection. |
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
  updatedBy?: string      // uid of writer (added 2026-05-14)
  updatedByName?: string  // best-effort display name resolved from users/{uid}
```

### History subcollection (added 2026-05-14)

```
soldierStatus/{hash}/history/{autoId}
  status: SoldierStatus
  customStatus?: string
  updatedAt: Timestamp
  updatedBy: string
  updatedByName?: string
  previousStatus?: SoldierStatus    // absent on the first ever write
  previousCustomStatus?: string
```

Append-only audit log; one entry per status mutation. The current doc mirrors
the latest entry, so the history collection answers "who and when" questions
for past states. Writes are sequential (read prior doc → write current →
append history) rather than transactional — the roster is small and the
mutation cadence is low, so the risk of two concurrent PUTs interleaving is
negligible.

`actor.displayName` is preferred when supplied (the `/api/soldier-status/[id]`
route passes `ApiActor.displayName`); otherwise the service joins
`users/{actor.uid}` for `firstName + lastName`. When neither resolves, the
current doc clears any stale `updatedByName` via `FieldValue.delete()` and the
history row carries no `updatedByName`.

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

1. Seed rows from `authorized_personnel` (firstName, lastName, phoneNumber, default platoon, `isRegistered: false`).
2. Override / add rows from `users`, preferring user-side firstName/lastName/teamId/phoneNumber (the registered soldier maintains it themselves) and flipping `isRegistered: true`.
3. Apply each soldier's `soldierStatus` overlay — status, customStatus, updatedAt.

The `isRegistered` flag flows out via `RosterEntry → Soldier` and drives the registered/unregistered dot rendered before the soldier name on both desktop and mobile status tables.

`phoneNumber` is sourced with the same precedence: `users.phoneNumber` wins
when present, falling back to `authorized_personnel.phoneNumber`. The field
is left undefined when neither source carries one; the UI renders an em-dash
in that case. Formatting (Israeli local 0xx-xxx-xxxx) happens in the table
component via `formatPhoneForDisplay`.

Defaults:
- Missing `teamId` on the user → `'מסייעת'` (matches the legacy sheet default).
- Missing `soldierStatus` doc → `status: 'בית'`.

## Notes

- The roster is small (single sayeret). When the size grows past a few hundred,
  revisit the full-collection read in `serverListRoster`.
- Doc-id is hash, not raw personnel number — by design. The raw personnel
  number is never stored in the system after registration, so the migration
  drops the old "include personnel number in report" feature on `/status`.
- Backfill script (`scripts/migrate-soldier-status.ts`) was retired on 2026-05-12 after production data landed. Recover from git history if a re-run is ever needed.
