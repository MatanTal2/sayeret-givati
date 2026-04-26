# db/server/ammunitionReportsService.ts

**File:** `src/lib/db/server/ammunitionReportsService.ts`
**Status:** Active (Phase 4 — Ammunition feature)

## Purpose

Atomic submit of an ammunition usage report. One Firestore transaction spans:

1. Read the reporter's stock or item docs.
2. Decrement `ammunitionInventory` (BRUCE / LOOSE_COUNT) **or** flip
   `ammunition` items to `CONSUMED` (SERIAL).
3. Write the `ammunitionReports` doc.

After the transaction commits, side effects fan out:

- Action log entry on `actionsLog` (`AMMO_REPORT_SUBMITTED`).
- Notifications to the reporter's TL(s) and the configured responsible manager.

Side effects are not transactional with the report — failures are logged but
do not roll back. This trades off "perfect" atomicity for a much simpler
single-transaction Firestore call.

## Exports

| Export | Purpose |
|--------|---------|
| `validateSubmitReportInput` | Pure validator. Type-checks every field; ranges (negative numbers, unknown enums) are rejected. |
| `serverSubmitAmmunitionReport` | Runs the transaction + side effects. Returns `{ reportId, notificationRecipientIds }`. |
| `serverListAmmunitionReports` | Filtered list — date range + teamId + reporterId + templateId. Ordered by `usedAt desc`. |

## Permission model

Phase 4 ships **self-report only** — reporter must be the holder of the
inventory being decremented. The transaction enforces this directly:

- BRUCE / LOOSE_COUNT: stock doc id is `USER_${reporterUid}_${templateId}` —
  reads from a different doc id are not possible.
- SERIAL: each item's `currentHolderId === reporterUid` is asserted.

Phase 6 will broaden this when manager-triggered reports land — the report
service will accept a `reportRequestId` already present today as a passthrough.

## Recipient resolution

`resolveRecipients(reporterUid)` after the txn:

1. Read `users/{reporterUid}` for `teamId`.
2. Query `users` where `teamId == reporter.teamId AND userType == TEAM_LEADER`.
3. Read `systemConfig/main.ammoNotificationRecipientUserId`.
4. Build the deduped target list excluding the reporter.

The fan-out uses `serverCreateBatchNotifications` (already does Promise.allSettled
internally so a single bad recipient doesn't drop the whole batch).
