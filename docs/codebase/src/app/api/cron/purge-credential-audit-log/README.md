# POST /api/cron/purge-credential-audit-log

**File:** `src/app/api/cron/purge-credential-audit-log/route.ts`
**Status:** Active (PR-C follow-up — Council Q5=a, 1-year retention)

## Purpose

Daily retention sweep for `credentialAuditLog`. Deletes any entry whose `timestamp` is older than the retention window (default 365 days). Vercel Cron invokes this route daily at 03:30 UTC (offset 30 min from the sweep-account-deletions cron so the two don't compete for the same warm-start slot). Configured in `vercel.json`.

## Auth

Header: `Authorization: Bearer ${process.env.CRON_SECRET}`. Verification uses `crypto.timingSafeEqual`. Vercel auto-injects the same `Authorization` header on scheduled invocations once `CRON_SECRET` is set in the project env. The secret is shared with `sweep-account-deletions` — both cron routes trust the same operator-rotated value.

**Not** bearer-Firebase-token gated. This is a system-to-system endpoint with its own trust boundary — do not try to reuse `getActorFromRequest`.

## Production-project gate

Refuses with 503 unless `NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'sayeret-givati-1983'`. A preview or dev deployment that accidentally inherits a real cron schedule cannot vaporise prod audit history.

## Query flags

| Flag | Default | Clamp | Effect |
|---|---|---|---|
| `?dryRun=true` | `false` | — | Pages through the matching set without writing. Safety net for first manual hit. |
| `?ageDays=N` | `365` | 1..3650 | Override retention window. |
| `?maxDeletes=N` | `5000` | 1..10000 | Per-invocation hard cap on deletes. A run that hits the cap returns `truncated: true` so the next tick picks up the rest. |

## Response

200 with `PurgeResult`:

```json
{
  "success": true,
  "examined": 412,
  "deleted": 412,
  "failed": 0,
  "dryRun": false,
  "ageDays": 365,
  "cutoff": "2025-05-14T03:30:00.000Z",
  "durationMs": 1815,
  "truncated": false
}
```

Error responses:
- `401 unauthorized` — bearer mismatch.
- `503 cron_disabled` — `CRON_SECRET` env var missing.
- `503 wrong_project` — running outside the prod Firebase project.
- `400 bad_age_days` / `bad_max_deletes` — query param is not a number.
- `500 purge_failed` — service threw at the top level.

## Observability

A single `[cron/purge-credential-audit-log] done` log per run carries the full `PurgeResult`. A batch-level commit failure mid-run emits `batch delete failed: <message>` and bails out — `failed` is non-zero on the response; the next scheduled run will retry the same `< cutoff` query.

## Related

- `src/lib/db/server/credentialAuditService.ts` — `serverPurgeCredentialAuditLog` + `CREDENTIAL_AUDIT_RETENTION_DAYS`.
- `scripts/purge-credential-audit-log.js` — operator-callable mirror that loads `.env.local` directly. Run with `--dry-run`, `--age-days N`, `--project <id>`.
- `vercel.json` — schedule entry (`30 3 * * *`).
- `project_settings_page` memory — PR-C Council follow-up list.
