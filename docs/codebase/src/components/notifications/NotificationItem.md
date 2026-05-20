# NotificationItem.tsx

**File:** `src/components/notifications/NotificationItem.tsx`  
**Lines:** 160  
**Status:** Active

## Purpose

Individual notification item with type-based styling (icon + color), read/unread visual state, and mark-as-read / delete action buttons. Maps notification types to Hebrew labels and colors.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `notification` | `NotificationDisplayData` | ✅ | Notification data to render |

## Click routing (Phase 6)

`handleClick` calls `markAsRead` and then routes via `next/navigation`. `resolveNotificationTarget` maps the notification type:

- `template_request_approved` → `/equipment?resumeTemplate={relatedEquipmentDocId}` (the equipment page reads the param and opens `AddEquipmentWizard` with the matching draft pre-filled).
- Equipment-domain types (transfer, retirement, report-request, force-ops, daily-check, maintenance) → `/equipment`.
- Manager-side template-review types (`template_proposed_for_review`, `new_template_request_for_review`, `template_request_rejected`) → `/management?tab=template-management` so the management page lands directly on the equipment-template tab instead of the default user tab.

`resolveNotificationTarget` is exported for unit tests in `__tests__/NotificationItem.test.tsx` — covers the equipment auto-open route, the management tab routing, and the no-duplicates / snake_case enum sanity suite.

Since PR-A (2026-05-20) the function compares against `NotificationType` enum members directly — `src/types/notifications.ts` is the single source of truth, and the previous string-cast workaround for the duplicate `src/types/equipment.ts` enum is gone.

## Known Issues

- Inline Hebrew in `getTypeLabel` function — notification type labels hardcoded.
- Uses `NotificationContext` for `markAsRead` and `deleteNotification` actions.
