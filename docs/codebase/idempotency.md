# Idempotency helper

**File:** `src/lib/db/server/idempotency.ts`
**Status:** Active (Phase 4a)
**Spec:** `docs/spec/offline-first.md` Phase 4

## What it does

`withIdempotency(request, actor, rawBody, handler, options?)` dedupes
duplicate replays of mutating API requests using the
`Idempotency-Key: <client-uuid>` HTTP header.

Storage: `_idempotency/{uid}_{key}` doc. Rules deny client access; server-only.

## Flow

```
client → POST /api/foo  (Idempotency-Key: K)
   │
   ▼
withIdempotency:
   tx.create(_idempotency/{uid}_K, {requestHash, status:'pending', createdAt, expiresAt})
   │
   ├─ ok → run handler → ref.update({status:'committed', snapshot})
   │
   └─ ALREADY_EXISTS → ref.get()
         ├─ requestHash differs           → 422 IDEMPOTENCY_KEY_REUSED  (M2)
         ├─ status:'committed'            → return cached snapshot      (S1)
         ├─ status:'pending' fresh        → poll up to 5s
         └─ status:'pending' >30s old     → steal lock, recurse
```

## Snapshot shape (S1)

```ts
{
  status: number;
  code?: string;
  resourceId?: string;
  createdIds?: string[];
  newUpdatedAt?: string;
  bodyHint: 'inline' | 'refetch';
  inlineBody?: unknown;
}
```

Default is `{ status:200, bodyHint:'refetch' }`. Pass `options.toSnapshot` to
return a real ID / version that the client outbox needs for chaining
(M3 in Phase 5).

The wrapper truncates any inline body that would push the doc past 64 KB
back to `bodyHint:'refetch'`. Audit decision S1.

## Why not strictly atomic with the data write (M1)

The audit's preferred path threads a Firestore `Transaction` through every
service so the idempotency record and the data + audit writes commit
together. Doing so across ~63 mutation routes is a multi-PR refactor.

The lock-based version ships now. External guarantee — no double-write
under concurrent replay — is identical. The narrow window:

1. Caller A acquires the lock (`pending` written).
2. Caller A's handler commits the data writes.
3. Caller A crashes before patching the lock to `committed`.

Stale-pending detection (>30s) steals the lock and re-runs the handler.
If the handler is re-entrant (most services are by design), the second
run is a no-op against the already-committed state. Routes that are
**not** safely re-entrant must opt out and switch to the strictly-atomic
path before they wrap.

## Wiring on the client

`src/lib/apiFetch.ts` injects `Idempotency-Key: <crypto.randomUUID()>` on
every POST/PUT/PATCH/DELETE unless the caller supplies one. Phase 5's
outbox replay loop overrides by setting the original key on retry — that's
how dedupe stays consistent across reconnect cycles.

## TTL

- Field `expiresAt` is set to `createdAt + 24h`.
- Firestore TTL purges records past `expiresAt` (config in
  `firebase/firestore.indexes.json` `fieldOverrides`).
- `/api/cron/sweep-idempotency` (daily at 04:00 UTC via `vercel.json`)
  belt-and-braces deletes any record past `expiresAt + 24h` if TTL is
  misconfigured.

## Index

- `(expiresAt ASC)` on `_idempotency` for the cron sweeper.
  See `firebase/firestore.indexes.json`.

## Deployment checklist (Phase 4)

Before this PR merges:
1. `firebase deploy --only firestore:rules` — pushes the deny rule.
2. `firebase deploy --only firestore:indexes` — pushes the new composite + TTL.
3. Verify TTL is enabled:
   `gcloud firestore fields ttls update expiresAt --collection-group=_idempotency --project=sayeret-givati-1983`
   (or toggle in Firebase Console → Firestore → Indexes → TTL).
4. `CRON_SECRET` must be set in Vercel; same value already used by the other crons.

## Migration tracking

`docs/spec/idempotency-route-migration.md` is the canonical checklist for
which mutation routes are wrapped. Phase 5 cannot start until that list
is fully ✅ or `SKIP — reason`.
