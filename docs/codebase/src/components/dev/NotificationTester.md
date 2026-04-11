# NotificationTester.tsx

**File:** `src/components/dev/NotificationTester.tsx`  
**Lines:** 165  
**Status:** Active (dev-only)

## Purpose

Development tool for testing notification creation and cleanup. Provides buttons to create test notifications of various types and delete them. Uses `testNotifications` utilities.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | ❌ | Additional classes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `isLoading` | `boolean` | Operation in progress |
| `message` | `string` | Status message |

## Firebase Operations

- **Write:** `createTestNotification()` — writes to `notifications` collection
- **Delete:** `deleteNotification()` — deletes from `notifications` collection

## Notes

- Dev-only component — should be gated or removed in production.
- Inline Hebrew text throughout.
