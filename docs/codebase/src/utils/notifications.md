# utils/notifications.ts

**File:** `src/utils/notifications.ts`  
**Lines:** 447 ⚠️ LONG  
**Status:** Active

## Purpose

Notification service for Firestore operations and notification template generation. Handles creating, reading, updating, and deleting notifications, plus pre-built templates for common events (transfer requests, approvals, status changes, etc.).

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `NotificationService` | class (static) | `createNotification()`, `getUserNotifications()`, `markAsRead()`, `markAllAsRead()`, `deleteNotification()`, `getUnreadCount()`, `createBatchNotifications()` |
| `NotificationTemplates` | class (static) | Pre-built notification templates for common events |
| `notifyTransferRequest` | function | Helper to create transfer request notification |
| `notifyTransferApproved` | function | Helper to create transfer approved notification |
| `notifyTransferRejected` | function | Helper to create transfer rejected notification |
| `notifyStatusChange` | function | Helper to create status change notification |
| `notifyEquipmentAssigned` | function | Helper to create equipment assigned notification |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `notifications` | `addDoc` | `createNotification()` |
| `notifications` | `getDocs`, `query` | `getUserNotifications()`, `getUnreadCount()` |
| `notifications` | `updateDoc` | `markAsRead()` |
| `notifications` | `writeBatch` | `markAllAsRead()`, `createBatchNotifications()` |
| `notifications` | `deleteDoc` | `deleteNotification()` |

## Known Issues

- 447 lines — should split service from templates.
