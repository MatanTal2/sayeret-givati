# /api/soldier-status

Bearer-token-gated read + write for the `soldierStatus/{hash}` collection.
Replaces the legacy zero-auth `/api/sheets` route. Open to any authenticated
user; audit fields are intentionally NOT persisted yet — the actor is verified
via Firebase ID token but not stored on the doc.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/soldier-status` | Joined roster (`users` ∪ `authorized_personnel`) with each soldier's current status. |
| `PUT`  | `/api/soldier-status/[id]` | Upsert one soldier's status. `[id]` is the `militaryPersonalNumberHash`. |

## Request shapes

### GET /api/soldier-status

Empty body. Returns:

```ts
{
  success: true,
  soldiers: Array<{
    id: string;             // militaryPersonalNumberHash
    firstName: string;
    lastName: string;
    platoon: string;
    status: 'בית' | 'משמר' | 'אחר';
    customStatus?: string;
    updatedAtMs?: number;
  }>
}
```

### PUT /api/soldier-status/[id]

```ts
{
  status: 'בית' | 'משמר' | 'אחר';
  customStatus?: string;     // required iff status === 'אחר'
}
```

Returns `{ success: true }` or a `SoldierStatusValidationError`-mapped 4xx.

## Auth

Both routes use `getActorOrError(request)` — bearer token required. The actor
is verified for authentication but the uid is not persisted. PUT is open to
any authenticated user; tightening to a role-gated set is queued behind the
audit follow-up.

## Error mapping

`SoldierStatusValidationError` carries a numeric `status` (400 for invalid
input, 404 when the hashed id matches no roster row). Routes catch it and
return `NextResponse.json` with that status. Anything else falls through to
a 500.

## Backfill

The one-shot CSV → Firestore migration script (`scripts/migrate-soldier-status.ts`)
was removed on 2026-05-12 after production data landed. Per-doc backfill is no
longer needed: new status writes happen exclusively via the API, and the
roster join falls back to status `'בית'` for any soldier without a
`soldierStatus/{hash}` doc.

If the migration ever needs to be re-run from history, recover the script
from git (`git show <pre-removal-commit>:scripts/migrate-soldier-status.ts`).
