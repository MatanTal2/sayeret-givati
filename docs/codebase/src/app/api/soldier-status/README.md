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

One-shot Node script `scripts/migrate-soldier-status.ts`:

1. Export the legacy Google Sheet to CSV.
2. `GOOGLE_APPLICATION_CREDENTIALS=./sa.json ts-node scripts/migrate-soldier-status.ts --project sayeret-givati-1983 --csv ./sheet-export.csv`
3. Verify a sample of rows in Firebase console before pointing production traffic at `/api/soldier-status`.

The script is idempotent and supports `--dry-run`. It hashes raw personnel
numbers from column A and writes `soldierStatus/{hash}`. Rows with no
matching `authorized_personnel` or `users` doc are logged and skipped.
