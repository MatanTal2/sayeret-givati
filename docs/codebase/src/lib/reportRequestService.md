# reportRequestService.ts

**File:** `src/lib/reportRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Client facade for manager-triggered "report now" demands. Scopes: `user | items | team | all`. Per-user fulfillment tracked on the request doc; status rolls `pending → partially_fulfilled → fulfilled`. Expiry is 48h by default, checked lazily on read.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createReportRequest` | `({ actor, scope, targetUserIds, ... }) => Promise<string>` | Manager creates request |
| `fulfillReportRequest` | `(requestId, userId) => Promise<void>` | Called when a target user reports an item in scope |
| `getPendingReportRequestsForUser` | `(userId) => Promise<ReportRequestDoc[]>` | User's inbox (filters expired + already-fulfilled) |
| `getReportRequestsByRequester` | `(requesterUserId) => Promise<ReportRequestDoc[]>` | Manager's history |

## Firebase Operations

Writes via `/api/report-requests` + `/api/report-requests/fulfill`. Reads via client SDK on `reportRequests`.

## Notes

- Only manager+ can create; enforced both client (UI) and server (policy check in API route).
- Staleness badge on equipment cards is computed from `lastReportUpdate` client-side (no cron).
