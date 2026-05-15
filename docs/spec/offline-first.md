# Feature: Offline-First Migration

> Status: **Phase 0 in progress.** This document is the canonical source of truth
> for the offline-first migration. All phase PRs reference back to it. The audit
> in `~/.claude/plans/system-reminder-you-re-running-in-declarative-sphinx.md`
> is the genesis document; this spec absorbs its decisions and patch list.

## Goal

Allow the Sayeret Givati app to operate fully offline on flaky / no connectivity
(field use, IDF base dead zones, mixed iOS/Android devices). Mutations queue
locally and replay safely when connectivity returns. Reads serve from a
persistent local cache. Conflicts surface to the user rather than corrupting
state.

## Non-Goals

- Peer-to-peer sync between devices without server round-trip.
- Encrypted-at-rest queue payloads (see [S10 decision](#locked-decisions)).
- Full audit/history sourcing from `_idempotency` (use `actionsLog` instead — see [S1 decision](#locked-decisions)).

## Phasing (9 PRs)

| Phase | Scope |
|-------|-------|
| **0** | This spec, state machine, `OFFLINE_REPLAY_CONCURRENCY` flag. No runtime behavior change. |
| **1** | Firebase Firestore persistent cache: enable `persistentSingleTabManager({ forceOwnership: false })` in `src/lib/firebase.ts`. Existing reads hit IndexedDB on cold-load. |
| **2** | `next.config.ts` remote-image patterns + bundle-budget CI gate. Prep for SW. |
| **3** | `@serwist/next` PWA shell. SW installs, **waits** for user-driven `SKIP_WAITING` (M5). `/sw.js` cache-control verified `no-cache` (S7). Update toast wired. |
| **4** | Server-side idempotency: `_idempotency` collection, `withIdempotency(actor, key, fingerprint, fn)` helper, all ~29 mutation routes wrapped. Atomic `tx.create` as sync point (M1). Fingerprint-mismatch → 422 (M2). TTL gcloud step + cron sweeper (S2). |
| **5** | Outbox + replay. `src/lib/offline/outbox.ts` (`DB_VERSION` + upgrade callback, M4). `src/lib/offline/replay.ts` (chained `If-Match` rewrites M3, await `onAuthStateChanged` M6, page-thread fallback for iOS M7, concurrency cap 3 + token cache S3). `OutboxContext` overlays optimistic state (S9). Threat model doc (S10). |
| **6** | Conflict UX. `ConflictCenter` aggregator (S4) lives in TopBar. 409s persist in IndexedDB across reloads. |
| **7** | SWR-style hooks. Drop legacy `src/lib/cache.ts` localStorage with one-time migration shim (S6). Cache invalidation on auth/permission revocation (S5). |
| **8** | Telemetry SLOs + alert thresholds (S8). `/debug/offline` excluded from prod builds (N6). User-facing help page. |

Sequencing constraint: **P4 must merge before P5.** Replay without server
dedupe doubles writes on every reconnect.

## Queue Item State Machine

```
   enqueued
       │
       ▼
  ┌──────────┐  online + auth OK    ┌───────────┐
  │ pending  │ ───────────────────► │ replaying │
  └──────────┘                       └─────┬─────┘
       ▲                                   │
       │ awaiting_auth (auth.uid != entry.uid)
       │                                   │
       │                                   ├─► 200  ─► synced (remove)
       │                                   │
       │                                   ├─► 409  ─► conflict ─► resolved-keep / resolved-discard
       │                                   │
       │                                   ├─► 401  ─► awaiting_auth (pause)
       │                                   │
       │                                   ├─► 422  ─► poisoned (idem-key reused w/ different body) ─► surfaced to user
       │                                   │
       │                                   └─► 5xx  ─► backoff (1s,4s,16s,64s,5min) ─► retry / stuck after 5
       │
       └──── same UID signs back in ◄────── (any paused state)
```

State definitions:

- **pending** — entry enqueued in IndexedDB, waiting for online + matching auth.
- **replaying** — request in flight to server.
- **awaiting_auth** — paused because no authenticated user or signed-in UID
  differs from the UID that enqueued the entry. Resumes when the originating
  UID signs in again.
- **conflict** — server returned 409 (`If-Match` mismatch). Entry surfaces to
  `ConflictCenter` for user resolution (keep local / discard / merge).
- **poisoned** — server returned 422 because the idempotency key was reused
  with a different request fingerprint. Entry never retries automatically; user
  must inspect.
- **stuck** — exceeded 5 backoff cycles. Surfaced in settings → offline diagnostics.
- **synced** — committed; row removed from outbox.

## Locked Decisions

1. **S1 — Snapshot policy (`_idempotency` body shape).** Truncate + re-fetch hint. Snapshot is a backend synchronization token plus the minimum data the client needs to chain the next mutation (`newUpdatedAt`, `resourceId`, `createdIds`) or resolve temp→server IDs. `actionsLog` remains the audit source of truth. Snapshot doc has a 64 KB hard cap; typical size <4 KB.

   ```ts
   type IdempotencySnapshot = {
     status: number;
     code?: string;
     resourceId?: string;
     createdIds?: string[];
     newUpdatedAt?: string;
     bodyHint: 'inline' | 'refetch';
     inlineBody?: unknown;
     requestHash: string;
     expiresAt: Timestamp;
   };
   ```

   Default `bodyHint: 'refetch'`. Inline only when payload is tiny and useful (e.g. `{ ok: true }`).

2. **S10 — Queue encryption posture.** Rely on OS-level device encryption. No
   app-layer AES-GCM wrap of queue payloads. Operational reliability (queue
   survives session expiry / app crash / dead-zone reconnects) outweighs the
   localized stolen-device risk an in-memory key would mitigate — orphaned
   queue entries with a lost wrapping key are a worse outcome.

   Deployment prerequisite: IDF-issued devices ship with passcode + biometric +
   full-disk encryption + short screen-lock timeout. This is **policy**, not
   code; `docs/spec/offline-threat-model.md` (P5) calls it out explicitly.

## Patch List Per Phase

(Derived from audit. Implementer must confirm file paths during each PR.)

| Phase | Adds / Changes |
|-------|----------------|
| 0 | This spec. State machine doc. `OFFLINE_REPLAY_CONCURRENCY` flag (default 3) in `src/lib/offline/config.ts`. |
| 1 | None beyond persistent-cache enablement. |
| 2 | None beyond config / bundle-budget. |
| 3 | M5 (user-triggered `SKIP_WAITING` via message protocol). S7 (`/sw.js` cache-control `no-cache`). |
| 4 | M1 (atomic tx with `tx.create` as sync point). M2 (request-fingerprint 422 path). S1 (bounded snapshot per shape above). S2 (TTL gcloud step + cron sweeper). N3 (composite index `(uid, expiresAt)` for sweeper). |
| 5 | M3 (chained `If-Match` rewrite on replay). M4 (`DB_VERSION` + upgrade callback). M6 (await `onAuthStateChanged`). M7 (page-thread fallback for iOS). S3 (concurrency cap 3 + per-batch token cache). S9 (hooks project from `(server, outbox)`). S10 (threat model doc). |
| 6 | S4 (`ConflictCenter` aggregator + IndexedDB persistence across reloads). |
| 7 | S5 (cache invalidation on auth/permission change). S6 (one-time `localStorage` → Firestore persistent cache migration shim, 30-day sunset). |
| 8 | S8 (SLO doc + alert thresholds wired to monitors). N6 (`/debug/offline` prod-build exclusion). |

## Critical Files (repo-relative — confirm at implementation time)

- `src/lib/firebase.ts` — P1 persistent cache config.
- `src/lib/apiFetch.ts` — P4 idem-key injection, P5 outbox gate.
- `src/lib/db/server/auth.ts` — P4 `withIdempotency` composes on `getActorOrError`.
- `src/lib/db/server/idempotency.ts` — P4 new; M1 / M2 logic.
- `src/lib/db/core.ts` — P4 tx helpers.
- `src/lib/offline/config.ts` — P0 `OFFLINE_REPLAY_CONCURRENCY` flag.
- `src/lib/offline/outbox.ts` — P5 new; M4 versioning, S9 projection.
- `src/lib/offline/replay.ts` — P5 new; M3 chain, M6 auth-await, M7 page fallback, S3 concurrency.
- `src/contexts/OutboxContext.tsx` — P5 new; feeds optimistic projection.
- `src/app/sw.ts` — P3 (M5 message protocol), P5 (sync handler).
- `src/components/conflicts/ConflictCenter.tsx` — P6 new.
- `next.config.ts` — P2 remotePatterns, P3 withSerwist, S7 headers.
- `firestore.rules` — P4 deny `_idempotency` to clients.
- `firestore.indexes.json` — P4 composite index.
- `vercel.json` — P4 TTL safety cron, P8 stuck-queue sweeper.
- All ~29 mutation routes under `src/app/api/**/route.ts` — P4 wrapping.

## Verification Additions

Beyond per-phase tests:

- **M1 race test** — Jest + Firestore emulator. Two parallel `withIdempotency(actor, K, hash, fn)` with `fn` incrementing a counter → counter increments exactly once.
- **M2 fingerprint test** — same key + different body → 422; same key + same body → cached snapshot.
- **M3 chain test** — Playwright. `/equipment` offline → edit item, edit again → online → both edits apply, no 409 surfaces.
- **M4 migration test** — seed IndexedDB with v1 fixture, load app on v2 code, entries readable + replayable.
- **M5 update flow test** — Playwright. Deploy v1 → load → deploy v2 → reload → toast appears, queued items not auto-drained until user accepts.
- **M6 cold-load test** — seed queue, hard-reload, queue drains without user interaction.
- **M7 iOS path test** — WebKit Playwright (no Background Sync), queue drains on `online` event in page thread.
- **S3 stampede test** — seed 200 entries, go online, in-flight request count never exceeds 3.
- **S5 revocation test** — sign in as admin, cache `/management`, revoke own admin role server-side, re-navigate → no stale management data.

## Per-Doc Audit Trail

As each phase ships, findings are reflected in:

- `docs/codebase/idempotency.md` — M1, M2, S1, S2 (P4)
- `docs/codebase/outbox.md` — M3, M4, M6, M7, S3, S9 (P5)
- `docs/codebase/pwa-shell.md` — M5, S7 (P3)
- `docs/spec/offline-threat-model.md` — S10 (P5)

## Estimated Net Impact

~4,700 LOC across 9 PRs (audit patches add ~+600 over original Gemini plan).

## Resume Pointer

- ✅ **Phase 0** — spec + `OFFLINE_REPLAY_CONCURRENCY` flag (PR #121).
- ✅ **Phase 1** — Firestore persistent cache enabled in `src/lib/firebase.ts` (PR #122).
- ✅ **Phase 2** — `next.config.ts` Firebase Storage `remotePatterns`. `scripts/check-bundle-size.js` + `bundle-budget.json` + `npm run bundle-budget` script. CI wiring (build job + budget step) lands with P3 PR when the SW adds the first real chunk weight.
- ⬜ **Phase 3** — Serwist PWA shell + bundle-budget CI step + user-driven `SKIP_WAITING`.
- ⬜ **Phase 4..8** — see table above.
