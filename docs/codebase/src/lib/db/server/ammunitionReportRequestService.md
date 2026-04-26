# db/server/ammunitionReportRequestService.ts

**File:** `src/lib/db/server/ammunitionReportRequestService.ts`
**Status:** Active (Phase 6 — Ammunition feature)

## Purpose

Manager-triggered "please report" demands for ammunition. Mirrors the
equipment `reportRequestService.ts` shape.

## Exports

| Export | Purpose |
|--------|---------|
| `validateCreateReportRequestInput` | Pure validator. INDIVIDUAL needs `targetUserIds`; TEAM needs either `targetTeamId` or pre-resolved ids; ALL is unconstrained. |
| `serverCreateAmmunitionReportRequest` | Materializes targets server-side for TEAM/ALL when missing. Initializes `fulfillmentByUser` for every target. After write: `actionsLog` entry + `ammo_report_requested` notification fan-out (with `relatedEquipmentDocId = request.id` so deep links can carry the request id). |
| `serverCancelAmmunitionReportRequest` | Sets `status = 'CANCELED'`. |
| `serverPatchFulfillment(requestId, reporterId, reportId)` | Transactional update of `fulfillmentByUser[reporterId]`. Sets `status = 'CLOSED'` once everyone has fulfilled. Called by the report submit service when `reportRequestId` is present. |
| `serverListAmmunitionReportRequests` | Collection scan. |

## Firebase Operations

- `ammunitionReportRequests` — `set`, `update`, `get`, collection scan.
- `users` — `where(teamId)+where(status==active)` and `where(status==active)`
  to materialize TEAM/ALL targets.

## Notes

- The fulfillment patch is transactional but separate from the report write —
  if the patch fails (e.g. request was concurrently cancelled), the report
  itself is unaffected. The mismatch is logged but the user-visible flow is
  not disrupted.
- The notification carries `relatedEquipmentDocId = request.id` so the
  notification deep link can route to `/ammunition?requestId=...`.
