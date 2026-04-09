# utils/testNotifications.ts

**File:** `src/utils/testNotifications.ts`  
**Lines:** ~100  
**Status:** Active (dev-only)

## Purpose

Test utilities for creating and deleting test notifications. Used by `NotificationTester` component for development testing.

## Exports

- `createTestNotification(userId, type)` — creates a test notification in Firestore
- `deleteTestNotifications(userId)` — removes test notifications

## Firebase Operations

- **Write/Delete:** Operations on `notifications` collection

## Notes

- Dev-only utilities — should be excluded from production builds.
