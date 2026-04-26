# types/notifications.ts

**File:** `src/types/notifications.ts`  
**Lines:** 118  
**Status:** Active

## Purpose

Notification system types: notification document shape, type enum, context types, and batch notification data.

## Exports

- `Notification` — Firestore notification document
- `NotificationType` — enum: `TRANSFER_REQUEST`, `TRANSFER_APPROVED`, `TRANSFER_REJECTED`, `STATUS_CHANGE`, `EQUIPMENT_ASSIGNED`, `SYSTEM`, `DAILY_CHECK_REMINDER`, `AMMO_REPORT_SUBMITTED`, `AMMO_REPORT_REQUESTED`
- `NotificationContextType` — context value shape
- `NotificationSettings` — user notification preferences
- `BatchNotificationData` — batch notification creation
