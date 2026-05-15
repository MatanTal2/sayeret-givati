# Idempotency Route Migration

Tracking checklist for wrapping every mutating API route with
`withIdempotency` (`src/lib/db/server/idempotency.ts`).

**Status:** ✅ Complete — Phase 4b shipped 2026-05-15. Phase 5 (outbox/replay) is now unblocked.

**Why:** Phase 5 of the offline-first migration (outbox + replay) requires
server-side dedupe on every mutation route. Without it, every reconnect that
triggers a duplicate send doubles the write. See `docs/spec/offline-first.md`.

## Routes

| Route | Method(s) | Wrapped | Notes |
|-------|-----------|---------|-------|
| `/api/actions-log` | POST | ✅ | |
| `/api/ammunition-inventory` | POST | ✅ | |
| `/api/ammunition-inventory/[id]` | PUT/PATCH/DELETE | ✅ | |
| `/api/ammunition-report-requests` | POST/PATCH | ✅ | |
| `/api/ammunition-reports` | POST | ✅ | |
| `/api/ammunition-templates` | POST | ✅ | |
| `/api/ammunition-templates/[id]` | PUT/DELETE | ✅ | |
| `/api/auth/audit` | POST | SKIP — server-internal | Audit emitter; no client-driven retry. |
| `/api/auth/check-email-verified` | POST | SKIP — read-only side-effect | Reads Auth state; no write. |
| `/api/auth/register` | POST | SKIP — pre-auth | No bearer token. Server-side dedupe via personnel hash. |
| `/api/auth/verify-military-id` | POST | SKIP — pre-auth | |
| `/api/authorized-personnel` | POST/PUT/DELETE | ✅ | |
| `/api/authorized-personnel/bulk` | POST | ✅ | Large body; snapshot cap auto-fallback verified. |
| `/api/categories` | POST/PUT/DELETE | ✅ | |
| `/api/categories/subcategories` | POST/PUT/DELETE | ✅ | |
| `/api/cron/*` | POST | SKIP — cron | Vercel cron, single-fire via `CRON_SECRET`. |
| `/api/equipment` | POST/PUT | ✅ | |
| `/api/equipment/batch` | POST | ✅ | |
| `/api/equipment/report` | POST | ✅ | |
| `/api/equipment/retire` | POST | ✅ | |
| `/api/equipment/transfer` | POST | ✅ | |
| `/api/equipment/[id]/exchange/replace-by-another` | POST | ✅ | |
| `/api/equipment/[id]/exchange/request` | POST | ✅ | |
| `/api/equipment/[id]/storage/pull` | POST | ✅ | |
| `/api/equipment/[id]/storage/send` | POST | ✅ | |
| `/api/equipment-drafts` | POST/PUT/DELETE | ✅ | |
| `/api/equipment-templates/approve` | POST | ✅ | |
| `/api/equipment-templates/propose` | POST | ✅ | |
| `/api/equipment-templates/reject` | POST | ✅ | |
| `/api/equipment-templates` | POST/PUT | ✅ | |
| `/api/equipment-templates/[id]` | PATCH/DELETE | ✅ | |
| `/api/exchange-requests/[id]/approve` | POST | ✅ | |
| `/api/exchange-requests/[id]/reject` | POST | ✅ | |
| `/api/force-ops` | POST | ✅ | Admin-only forced operations. |
| `/api/guard-schedules` | POST | ✅ | |
| `/api/guard-schedules/[id]` | PATCH/DELETE | ✅ | |
| `/api/guard-schedules/[id]/share` | POST | ✅ | Clone-on-share — replay returns cached snapshot, no double-clone. |
| `/api/logistics-items` | POST/PUT/DELETE | ✅ | |
| `/api/logistics-templates` | POST/PUT/DELETE | ✅ | |
| `/api/notifications` | POST/DELETE | ✅ | |
| `/api/notifications/read` | PUT/POST | ✅ | Idempotent semantically; wrapped for cleanliness. |
| `/api/permission-grants` | POST | ✅ | |
| `/api/permission-grants/[id]/revoke` | POST | ✅ | |
| `/api/report-requests` | POST | ✅ | |
| `/api/report-requests/fulfill` | POST | ✅ | |
| `/api/retirement-requests/approve` | POST | ✅ | |
| `/api/retirement-requests/reject` | POST | ✅ | |
| `/api/soldier-status/[id]` | PUT | ✅ | |
| `/api/system-config` | PUT | ✅ | |
| `/api/training-plans` | POST | ✅ | |
| `/api/training-plans/[id]` | PATCH/DELETE | ✅ | |
| `/api/training-plans/[id]/restock-request` | POST | ✅ | |
| `/api/transfer-requests` | POST | ✅ | |
| `/api/transfer-requests/approve` | POST | ✅ | |
| `/api/transfer-requests/reject` | POST | ✅ | |
| `/api/users/account/cancel-delete` | POST | ✅ | |
| `/api/users/account/delete` | POST | ✅ | |
| `/api/users/phone-change/cancel` | POST | ✅ | |
| `/api/users/phone-change/confirm` | POST | ✅ | OTP-sensitive: `withIdempotency` dedupes replays so OTP cannot be consumed twice. |
| `/api/users/phone-change/initiate` | POST | ✅ | |
| `/api/users/profile` | PATCH | ✅ | |
| `/api/users/sessions/revoke` | POST | ✅ | |

## Status summary (2026-05-15)

- Wrapped: **54 mutation handlers** across 47 route files.
- Skipped: **6** (cron / pre-auth / server-internal).
- Pending: **0**.

## Process

Each wrap follows the same template — pull the body once via `request.text()`,
hand both `actor` and `rawBody` to `withIdempotency`, parse JSON inside the
closure. See `src/app/api/equipment/transfer/route.ts` for the canonical
pattern.

Verified per wrap:
- Inner handler safe to re-enter (stale `pending` lock can be stolen and re-run).
- Default snapshot (`status:200, bodyHint:'refetch'`) returned; routes that need `createdIds` / new `updatedAt` for client outbox chaining (M3) will switch to `options.toSnapshot` in Phase 5 when the outbox needs the data.
