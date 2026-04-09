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

## Known Issues

- Inline Hebrew in `getTypeLabel` function — notification type labels hardcoded.
- Uses `NotificationContext` for `markAsRead` and `deleteNotification` actions.
