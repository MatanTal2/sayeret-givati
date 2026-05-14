# ManagementSidebar.tsx

**File:** `src/components/management/sidebar/ManagementSidebar.tsx`
**Status:** Active

## Purpose

Container component for the management dashboard sidebar. Composes `SidebarHeader`, `SidebarNavigation`, and `SidebarFooter`. Handles responsive open/close with backdrop overlay on mobile.

## Layout

Root is `flex flex-col` so `SidebarNavigation`'s `flex-1 min-h-0` actually constrains the scroll area (bug #20 — before the fix, `flex-1` was dead and the tab list silently clipped on short viewports).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Sidebar visibility (mobile) |
| `activeTab` | `string` | ✅ | Currently active tab ID |
| `tabsByCategory` | `Record<string, ManagementTab[]>` | ✅ | Tabs grouped by category |
| `onTabChange` | `(tabId: string) => void` | ✅ | Tab selection handler |
| `onClose` | `() => void` | ✅ | Close sidebar handler |
| `userName` | `string` | ✅ | Display name for header |
