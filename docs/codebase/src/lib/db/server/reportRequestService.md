# db/server/reportRequestService.ts

**File:** `src/lib/db/server/reportRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Admin-SDK writes for `reportRequests`. Manager creates, target users fulfill.

## Exports

| Export | Purpose |
|--------|---------|
| `serverCreateReportRequest` | Creates doc, initializes `fulfillmentByUser` for all target UIDs, sets 48h default expiry, blasts `report_requested` notifications to every target. |
| `serverFulfillReportRequest` | Marks one user's fulfillment. Rolls request status through `pending → partially_fulfilled → fulfilled`. |

## Firebase Operations

- `reportRequests` — `set`, `get`, `update` (txn for fulfill)
- `actionsLog`, `notifications` — post-txn

## Notes

- Expiry is set at create time but not enforced server-side — client read helpers filter expired requests out.
- `scope` can be `user | items | team | all`; the `targetUserIds` list is materialized by the caller.
