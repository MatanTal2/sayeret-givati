# Idempotency Route Migration

Tracking checklist for wrapping every mutating API route with
`withIdempotency` (`src/lib/db/server/idempotency.ts`).

**Why:** Phase 5 of the offline-first migration (outbox + replay) requires
server-side dedupe on every mutation route. Without it, every reconnect that
triggers a duplicate send doubles the write. See `docs/spec/offline-first.md`.

**Gate:** Phase 5 PR cannot land until every row below is ✅ or marked
`SKIP — reason` and that decision is reflected back here.

## Routes

| Route | Method(s) | Wrapped | Notes |
|-------|-----------|---------|-------|
| `/api/actions-log` | POST | ⬜ | Append-only log; replay double-writes a row, but rows are timestamped → harmless. Wrap for cleanliness. |
| `/api/ammunition-inventory` | POST | ⬜ | |
| `/api/ammunition-inventory/[id]` | PATCH/DELETE | ⬜ | |
| `/api/ammunition-report-requests` | POST | ⬜ | |
| `/api/ammunition-reports` | POST | ⬜ | |
| `/api/ammunition-templates` | POST | ⬜ | |
| `/api/ammunition-templates/[id]` | PATCH/DELETE | ⬜ | |
| `/api/auth/audit` | POST | SKIP — server-internal | Audit emitter; no client-driven retry. |
| `/api/auth/check-email-verified` | POST | SKIP — read-only side-effect | Reads Auth state; no write. |
| `/api/auth/register` | POST | SKIP — pre-auth | No bearer token. Server-side dedupe via personnel hash. |
| `/api/auth/verify-military-id` | POST | SKIP — pre-auth | |
| `/api/authorized-personnel` | POST | ⬜ | |
| `/api/authorized-personnel/bulk` | POST | ⬜ | Large body; verify 64 KB snapshot cap behavior. |
| `/api/categories` | POST/PATCH/DELETE | ⬜ | |
| `/api/categories/subcategories` | POST/PATCH/DELETE | ⬜ | |
| `/api/cron/*` | POST | SKIP — cron | Vercel cron, single-fire via `CRON_SECRET`. |
| `/api/equipment` | POST | ⬜ | |
| `/api/equipment/batch` | POST | ⬜ | |
| `/api/equipment/report` | POST | ⬜ | |
| `/api/equipment/retire` | POST | ✅ | Wrapped in P4a. |
| `/api/equipment/transfer` | POST | ✅ | Wrapped in P4a. |
| `/api/equipment/[id]/exchange/replace-by-another` | POST | ⬜ | |
| `/api/equipment/[id]/exchange/request` | POST | ⬜ | |
| `/api/equipment/[id]/storage/pull` | POST | ✅ | Wrapped in P4a. |
| `/api/equipment/[id]/storage/send` | POST | ✅ | Wrapped in P4a. |
| `/api/equipment-drafts` | POST | ⬜ | |
| `/api/equipment-templates/approve` | POST | ⬜ | |
| `/api/equipment-templates/propose` | POST | ⬜ | |
| `/api/equipment-templates/reject` | POST | ⬜ | |
| `/api/equipment-templates` | POST | ⬜ | |
| `/api/equipment-templates/[id]` | PATCH/DELETE | ⬜ | |
| `/api/exchange-requests/[id]/approve` | POST | ⬜ | |
| `/api/exchange-requests/[id]/reject` | POST | ⬜ | |
| `/api/force-ops` | POST | ⬜ | Admin-only forced operations; verify replay semantics carefully. |
| `/api/guard-schedules` | POST | ⬜ | |
| `/api/guard-schedules/[id]` | PATCH/DELETE | ⬜ | |
| `/api/guard-schedules/[id]/share` | POST | ⬜ | Clone-on-share; replay must not double-clone. |
| `/api/logistics-items` | POST/PATCH/DELETE | ⬜ | |
| `/api/logistics-templates` | POST/PATCH/DELETE | ⬜ | |
| `/api/notifications` | POST | ⬜ | |
| `/api/notifications/read` | POST | ⬜ | Idempotent semantically; wrap for cleanliness. |
| `/api/permission-grants` | POST | ⬜ | |
| `/api/permission-grants/[id]/revoke` | POST | ⬜ | |
| `/api/report-requests` | POST | ⬜ | |
| `/api/report-requests/fulfill` | POST | ⬜ | |
| `/api/retirement-requests/approve` | POST | ⬜ | |
| `/api/retirement-requests/reject` | POST | ⬜ | |
| `/api/soldier-status/[id]` | PUT | ✅ | Wrapped in P4a. |
| `/api/system-config` | PATCH | ⬜ | |
| `/api/training-plans` | POST | ⬜ | |
| `/api/training-plans/[id]` | PATCH/DELETE | ⬜ | |
| `/api/training-plans/[id]/restock-request` | POST | ⬜ | |
| `/api/transfer-requests` | POST | ✅ | Wrapped in P4a. |
| `/api/transfer-requests/approve` | POST | ⬜ | |
| `/api/transfer-requests/reject` | POST | ⬜ | |
| `/api/users/account/cancel-delete` | POST | ⬜ | |
| `/api/users/account/delete` | POST | ⬜ | |
| `/api/users/phone-change/cancel` | POST | ⬜ | |
| `/api/users/phone-change/confirm` | POST | ⬜ | Security-sensitive; replay must not consume OTP twice. |
| `/api/users/phone-change/initiate` | POST | ⬜ | |
| `/api/users/profile` | PATCH | ✅ | Wrapped in P4a. |
| `/api/users/sessions/revoke` | POST | ⬜ | |

## Status summary (last updated 2026-05-15 P4a)

- Wrapped: **7** (high-traffic critical paths).
- Pending: **47**.
- Skipped: **6** (cron / pre-auth / server-internal).

## Process

Each wrap follows the same template — pull the body once via `request.text()`,
hand both `actor` and `rawBody` to `withIdempotency`, parse JSON inside the
closure. See `src/app/api/equipment/transfer/route.ts` for the canonical
pattern.

When wrapping, also confirm:
- The inner handler is safe to re-enter (in case a stale `pending` lock is stolen and the handler runs again — see helper docstring).
- The default snapshot (`status:200, bodyHint:'refetch'`) is acceptable; if the route returns `createdIds` or new `updatedAt` that the client outbox needs to chain (M3), pass `options.toSnapshot` to populate them.
