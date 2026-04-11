# ManagementSidebar.tsx

**File:** `src/components/management/sidebar/ManagementSidebar.tsx`  
**Lines:** 49  
**Status:** Active

## Purpose

Container component for the management dashboard sidebar. Composes `SidebarHeader`, `SidebarNavigation`, and `SidebarFooter`. Handles responsive open/close with backdrop overlay on mobile.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Sidebar visibility (mobile) |
| `activeTab` | `string` | ✅ | Currently active tab ID |
| `tabsByCategory` | `Record<string, ManagementTab[]>` | ✅ | Tabs grouped by category |
| `onTabChange` | `(tabId: string) => void` | ✅ | Tab selection handler |
| `onClose` | `() => void` | ✅ | Close sidebar handler |
| `userName` | `string` | ✅ | Display name for header |
