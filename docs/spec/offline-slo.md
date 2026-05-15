# Offline-First SLOs & Alert Thresholds

**Status:** Active (Phase 8 of offline-first migration). Audit note S8.
**Companion:** `docs/spec/offline-first.md`.

## Metrics

Emitted as `console.info('[offline.replay]', { ... })` for now. Future
Sentry wiring lands in a follow-up — the metric names below are the
contract.

| Metric | Source | Where it's emitted |
|--------|--------|-------------------|
| `queue_depth` | `OutboxContext.entries.length` | Read by alert pipeline; not yet emitted as a separate event. Sentry follow-up will sample it on a heartbeat. |
| `replay_success_rate` | `drained / (drained + conflicts + failures + stuck + poisoned)` per drain pass | `[offline.replay]` breadcrumb. |
| `conflict_409_rate` | `conflicts / total handled` | `[offline.replay]` breadcrumb. |
| `idempotency_hit_rate` | server-side: `_idempotency` `ALREADY_EXISTS` count / total writes | Emitted from `src/lib/db/server/idempotency.ts` (Phase 8b — not in this PR). |

## Alert thresholds

| Condition | Window | Severity | Action |
|-----------|--------|----------|--------|
| `replay_success_rate < 95%` | 1h | **PAGE on-call** | Likely backend regression or auth issue. Page on-call. |
| `queue_depth p95 > 50` | 24h | INVESTIGATE | Slow connectivity for many users OR replay bug stalling drains. Inspect outbox state on affected accounts. |
| `idempotency_hit_rate > 5%` of writes | 24h | INVESTIGATE | Indicates clients are double-sending the same `Idempotency-Key`. Likely an outbox bug rapidly retrying without backoff. |
| `conflict_409_rate > 2%` | 24h | REVIEW UX | Conflicts surface to users; rate >2% means real-time editing collisions are too frequent. Review whether `If-Match` semantics need relaxing on specific routes. |
| `stuck` entry rate > 0.1% of total | 24h | REVIEW | Stuck entries mean 5+ retries failed. Likely server-side regression or client clock skew. |

## Wiring (deferred)

The Phase 8 PR ships the metric contract and the `console.info`
breadcrumbs. Actual Sentry sampling + monitor configuration lands in a
follow-up tracked in `project_future_features` once Sentry is wired into
the project. The breadcrumb format is stable; replacing `console.info`
with `Sentry.addBreadcrumb` is mechanical.

## Operational runbooks

When an alert fires:

1. **`replay_success_rate` drop** — first check `[offline.replay]` logs in
   Vercel for the dominant error mode. If it's `network_error`, look at
   the user agent breakdown (mass mobile-network outage vs. backend
   failure). If it's `server_error: 5xx`, page backend.
2. **`queue_depth` p95 climb** — pull `/debug/offline` from a sample user
   account to inspect entries. Common cause: stuck at `awaiting_auth`
   because the user signed out before a queued entry could drain. Less
   common but worse: a route now 500s consistently — stuck after 5
   attempts. Server-side rollback is the right move.
3. **`idempotency_hit_rate` climb** — usually points to an outbox bug
   retrying without backoff. Check `replay.ts` `STUCK_AFTER_ATTEMPTS` and
   `BACKOFF_STEPS_MS` haven't drifted from spec.
4. **`conflict_409_rate` climb** — review whether two users are racing
   the same resource (e.g. soldier-status updates on the same soldier
   from multiple admins). Consider lifting `If-Match` to a set-union
   semantic on routes where that's safe.
