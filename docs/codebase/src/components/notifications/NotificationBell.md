# NotificationBell.tsx

**File:** `src/components/notifications/NotificationBell.tsx`  
**Lines:** 111  
**Status:** Active

## Purpose

Bell icon button with unread count badge. Toggles `NotificationDropdown` on click. Uses `NotificationContext` for unread count. Handles click-outside to close dropdown.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | ❌ | Additional classes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `isOpen` | `boolean` | Dropdown visibility |
