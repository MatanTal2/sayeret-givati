# POST /api/cron/sweep-account-deletions

**File:** `src/app/api/cron/sweep-account-deletions/route.ts`
**Status:** Active (PR-G follow-up, 2026-05-14)

## Purpose

Hard-delete sweep for accounts whose soft-delete request has aged past the 30-day retention window. Vercel Cron invokes this route daily at 03:00 UTC (configured in `vercel.json`).

## Auth

Header: `Authorization: Bearer ${process.env.CRON_SECRET}`. Verification uses `crypto.timingSafeEqual`. Vercel auto-injects the same `Authorization` header on scheduled invocations once `CRON_SECRET` is set in the project env.

**Not** bearer-Firebase-token gated. This is a system-to-system endpoint with its own trust boundary — do not try to reuse `getActorFromRequest`.

## Production-project gate

Refuses with 503 unless `NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'sayeret-givati-1983'`. Covers "env missing" and "running against a preview or dev project" in one check.

## Query flags

| Flag | Default | Effect |
|---|---|---|
| `?dryRun=true` | `false` | Runs the candidate query + per-uid pre-flight, no Auth/Firestore writes. Strong safety net for the first manual hit. |
| `?limit=N` | `25` | Per-run cap, clamped to `1..100`. Remaining candidates roll to the next tick. |

## Response

200 with `SweepResult` body:

```json
{
  "success": true,
  "examined": 3,
  "deleted": 1,
  "skipped": 2,
  "errors": [],
  "dryRun": false,
  "durationMs": 412,
  "candidates": [
    { "uid": "u1", "ageDays": 31, "outcome": "deleted" },
    { "uid": "u2", "ageDays": 30, "outcome": "skipped", "reason": "too_young" },
    { "uid": "u3", "ageDays": 35, "outcome": "skipped", "reason": "has_outstanding_assets", "message": "equipment=1 ammo=0 transfers=0" }
  ]
}
```

Error responses:
- `401 unauthorized` — bearer mismatch.
- `503 cron_disabled` — `CRON_SECRET` env var missing.
- `503 wrong_project` — running outside the prod Firebase project.
- `400 bad_limit` — `limit` query param is not a number.
- `500 sweep_failed` — sweep threw at the top level (per-uid failures land in `errors[]`, NOT here).

## Observability

`console.log` per candidate + per-result, so the Vercel function logs carry a full audit trail. The response body also includes the structured `SweepResult` for any cron-trigger UI to inspect.

Slack / email alerts on `errors.length > 0` are out of scope for this PR — Vercel function logs are the surface.

## Related

- `src/lib/db/server/accountDeletionService.ts` — `serverSweepAccountDeletions` (the service this route wraps).
- `scripts/sweep-account-deletions.js` — operator-callable mirror that loads `.env.local` directly. Run with `--dry-run`, `--limit N`, `--uid <uid>`.
- `vercel.json` — schedule entry.
- `docs/spec/account-deletion.md` — full feature spec.
