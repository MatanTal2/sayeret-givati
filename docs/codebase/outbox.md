# Offline outbox + replay

**Files:**
- `src/lib/offline/outbox.ts` — IndexedDB-backed store.
- `src/lib/offline/replay.ts` — drain loop.
- `src/lib/offline/allowlist.ts` — deny-by-default route eligibility.
- `src/lib/offline/config.ts` — `OFFLINE_REPLAY_CONCURRENCY` (default 3).
- `src/contexts/OutboxContext.tsx` — React provider + queue depth.
- `src/components/pwa/SyncStatusIndicator.tsx` — floating badge.

**Spec:** `docs/spec/offline-first.md` Phase 5.
**Threat model:** `docs/spec/offline-threat-model.md`.

## What it does

When the browser is offline and a mutation is invoked via `apiFetch`, the
request is enqueued in IndexedDB instead of failing. When connectivity
returns, the replay loop drains the queue: one bearer-token fetch per batch,
concurrency cap from the config flag, idempotency keys reused on retry so the
server-side `withIdempotency` wrapper dedupes.

## Queue entry shape

```ts
interface OutboxEntry {
  id?: number;             // auto-increment key
  uid: string;             // tagged for shared-device safety (T2)
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;             // path only
  headers: Record<string, string>;   // ID token excluded
  body: string;            // already JSON-stringified
  idempotencyKey: string;  // reused on retry
  routeName: string;       // e.g. 'equipment.transfer'
  status: 'pending' | 'replaying' | 'awaiting_auth' | 'conflict' | 'poisoned' | 'stuck' | 'synced';
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  resourceKey?: string;    // for M3 chain rewrites
  conflictState?: { detectedAt: number; serverData?: unknown };
}
```

## State machine

```
   enqueued ────────► pending ─[online+auth]─► replaying
                         ▲                         │
                         │ awaiting_auth (uid mismatch / 401)
                         │                         │
                         │                         ├─► 200  ─► synced (remove)
                         │                         │
                         │                         ├─► 409  ─► conflict   (P6 ConflictCenter)
                         │                         │
                         │                         ├─► 401  ─► awaiting_auth
                         │                         │
                         │                         ├─► 422 IDEMPOTENCY_KEY_REUSED ─► poisoned
                         │                         │
                         │                         ├─► 4xx other ─► poisoned
                         │                         │
                         │                         └─► 5xx ─► backoff [1s,4s,16s,64s,5min] ─► retry / stuck after 5
                         │
                         └────── same UID signs back in ◄───── any paused state
```

## Allowlist (deny-by-default)

`src/lib/offline/allowlist.ts` enumerates routes eligible to queue. Phase 5
ships with a small set (equipment transfer/retire/storage send & pull,
soldier-status). Adding a route requires:

1. Server route already wrapped with `withIdempotency` (see `docs/spec/idempotency-route-migration.md`).
2. Replay-while-offline behavior is desirable (e.g. routes that consume an
   OTP, revoke sessions, or touch permissions are explicitly excluded).
3. Add a rule to `RULES` with `routeName` and optional `resourceKey` for M3
   chain rewrites.

## M3 — chained `If-Match` rewriting

If a route's allowlist rule returns a `resourceKey` (e.g.
`equipment:${id}`), replay extracts the new `updatedAt` from the response
body and rewrites the `If-Match` header of the next queued entry on the same
resource before sending. Without this, a second offline edit to the same
item would 409 forever.

The default snapshot from `withIdempotency` returns
`{ success, idempotencyReplay: true, newUpdatedAt }`; replay reads
`newUpdatedAt` (or `updatedAt` as a fallback). Server routes that need
explicit chain support pass `options.toSnapshot` to ensure the field is
present.

## Auth-await on cold load (M6)

`drainOutbox` calls `waitForAuthSettled()` once at the top of every drain.
Internally it returns immediately if `auth.currentUser` is set, otherwise
listens for `onAuthStateChanged` exactly once. This prevents the cold-load
race where a signed-in user's first replay attempt sees `null` and pauses
the queue at `awaiting_auth`.

## iOS page-thread fallback (M7)

Background Sync is Chromium-only. Safari/iOS rely on the page-thread path:
`installAutoDrain()` wires `online` and `visibilitychange` listeners. Every
foreground tick attempts a drain. The Service Worker (Phase 3) can opt in to
a `sync` event handler later as an optimization, but the canonical path is
the page thread.

## Concurrency (S3)

Cap is `OFFLINE_REPLAY_CONCURRENCY` (default 3). One bearer token is fetched
per drain pass and reused across the batch. 429 from server triggers backoff
on the **batch**, not just the failing item.

## Phase 5b — partial S9 (shipped)

`OutboxContext.pendingResourceKeys: Set<string>` exposes resource keys with
uncommitted entries (status pending / replaying / awaiting_auth / conflict).
`src/hooks/usePendingSync.ts` is the narrow selector. List components query
it and flag rows as "syncing" without local optimistic state.

Full projection of pending mutations onto server data (e.g. showing the
post-transfer holder before the server confirms) is deferred to Phase 5c
once a projection helper proves out across more than one domain.
- **P6 — `ConflictCenter`.** 409s land in `conflictState` and bump the
  badge, but a per-conflict modal / aggregator UI is its own phase.
- **Background Sync registration.** Page-thread drain is the only path.

## Versioning (M4)

`DB_VERSION = 1` in `outbox.ts`. Future migrations bump the constant and
extend the `upgrade(db, oldVersion)` callback inside `openOutbox`. A v1 → v2
migration test will land alongside whatever schema change motivates it.

## Adding a new offline-eligible route

1. Confirm the server route is wrapped with `withIdempotency`.
2. Add a rule to `src/lib/offline/allowlist.ts`.
3. If the route mutates a resource that can be edited again offline before
   replay finishes, add `resourceKey` to the rule so M3 chain rewriting
   kicks in.
4. Confirm the server response includes a `newUpdatedAt` (default snapshot
   covers this).
5. Update `docs/codebase/outbox.md` notes if the route's replay semantics
   differ from the default (e.g. routes that 409 frequently).
