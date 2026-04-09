# SidebarNavigation.tsx

**File:** `src/components/management/sidebar/SidebarNavigation.tsx`  
**Lines:** 76  
**Status:** Active

## Purpose

Renders categorized tab navigation items with sorting and hover effects. Tabs are grouped by category with Hebrew category headers.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `string` | ✅ | Currently active tab ID |
| `tabsByCategory` | `Record<string, ManagementTab[]>` | ✅ | Tabs grouped by category |
| `onTabChange` | `(tabId: string) => void` | ✅ | Tab selection handler |

## Known Issues

- Category names hardcoded in Hebrew (sort order array).
