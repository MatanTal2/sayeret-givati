# types/notifications.ts

**File:** `src/types/notifications.ts`
**Status:** Active — single source of truth for notification types.

## Purpose

Notification system types: notification document shape, the unified `NotificationType` enum, context types, batch notification data, and display helpers.

## `NotificationType` enum — invariant

**Every value must have at least one producer in the codebase.** PR-A (2026-05-20) merged the previously-split enums (`src/types/notifications.ts` legacy + `src/types/equipment.ts` newer) into this file. Orphan values with no producer were dropped: `EQUIPMENT_UPDATE`, `MAINTENANCE_DUE`, `COMMANDER_MESSAGE`, `DAILY_CHECK_REMINDER`, `MAINTENANCE_REMINDER`, `OVERDUE_REPORT`, `SYSTEM_ALERT`, `GENERAL_MESSAGE`, `EQUIPMENT_TRANSFER_*` (3), `RETIREMENT_REQUEST` (the bare variant — only the `_APPROVAL`/`_APPROVED`/`_REJECTED` forms are real).

The `EXCHANGE_*` family (`EXCHANGE_REQUEST_APPROVAL`, `EXCHANGE_APPROVED`, `EXCHANGE_REJECTED`, `EXCHANGE_COMPLETED`) was added — `exchangeRequestService.ts` had been writing those values as raw string literals.

When adding a new notification type:

1. Add the value to the enum here.
2. Add a producer call site (`serverCreateNotification({ type: NotificationType.X, … })`) in the same PR.
3. Add the route to `resolveNotificationTarget` in `src/components/notifications/NotificationItem.tsx`.
4. Add icon + color cases in `src/contexts/NotificationContext.tsx`.
5. Add label case in `getTypeLabel` in `NotificationItem.tsx` if it should show in the bell UI.

A new type without all 5 of the above is dead-on-arrival and will be deleted on the next audit.

## Current values (grouped)

- **Ammunition:** `AMMO_ASSIGNED_FROM_CENTRAL`, `AMMO_REPORT_REQUESTED`, `AMMO_REPORT_SUBMITTED`, `AMMO_RESTOCK_REQUEST`
- **Equipment lifecycle:** `EQUIPMENT_STATUS_CHANGE`, `REPORT_REQUESTED`
- **Exchange:** `EXCHANGE_APPROVED`, `EXCHANGE_COMPLETED`, `EXCHANGE_REJECTED`, `EXCHANGE_REQUEST_APPROVAL`
- **Force-ops:** `FORCE_SIGNER_CHANGED`, `FORCE_TRANSFER_EXECUTED`
- **Guard schedule:** `GUARD_SCHEDULE_SHARED`
- **Retirement:** `RETIREMENT_APPROVED`, `RETIREMENT_REJECTED`, `RETIREMENT_REQUEST_APPROVAL`
- **System:** `SYSTEM_MESSAGE`
- **Templates:** `NEW_TEMPLATE_REQUEST_FOR_REVIEW`, `TEMPLATE_PROPOSED_FOR_REVIEW`, `TEMPLATE_REQUEST_APPROVED`, `TEMPLATE_REQUEST_REJECTED`
- **Training plan:** `TRAINING_PLAN_APPROVED`, `TRAINING_PLAN_REJECTED`, `TRAINING_PLAN_SUBMITTED`
- **Transfer:** `TRANSFER_APPROVED`, `TRANSFER_COMPLETED`, `TRANSFER_REJECTED`, `TRANSFER_REQUEST`

## Exports

- `Notification` — Firestore notification document
- `NotificationType` — unified enum (see above)
- `NotificationDisplayData` — UI-side shape (notification + computed `icon`/`color`/`timeAgo`)
- `NotificationContextType` — context value shape
- `NotificationSettings` — user notification preferences
- `BatchNotificationData` — batch notification creation input

## Tests

`src/components/notifications/__tests__/NotificationItem.test.tsx` includes a sanity suite (no duplicate values, snake_case) — keep it passing when modifying the enum.
