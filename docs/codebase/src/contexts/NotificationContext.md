# NotificationContext.tsx

**File:** `src/contexts/NotificationContext.tsx`  
**Lines:** 291  
**Status:** Active

## Purpose

Real-time notification provider. Uses Firestore `onSnapshot` listener to receive notifications for the current user. Provides methods for marking as read, marking all as read, deleting, and refreshing.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `NotificationProvider` | component | Context provider |
| `useNotifications` | hook | Access notification state and actions |
| `useNotificationDisplay` | hook | Helper that formats notifications for display (icons, time-ago, type labels) |

## Context Value

```typescript
{
  notifications: NotificationDisplayData[],
  unreadCount: number,
  isLoading: boolean,
  markAsRead: (id: string) => Promise<void>,
  markAllAsRead: () => Promise<void>,
  deleteNotification: (id: string) => Promise<void>,
  refreshNotifications: () => Promise<void>
}
```

## Firebase Operations

- **Listen:** `onSnapshot(query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc')))` — real-time listener
- **Write:** `NotificationService.markAsRead()`, `.markAllAsRead()`, `.deleteNotification()`
- **Read:** `NotificationService.getUserNotifications()` — fallback fetch

## Notes

- `useNotificationDisplay` handles various Timestamp formats defensively (Firestore Timestamp, `_seconds` format, string dates).
- Unsubscribes from listener on auth change or unmount.
