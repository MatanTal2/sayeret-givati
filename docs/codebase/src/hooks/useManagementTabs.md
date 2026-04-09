# useManagementTabs.ts

**File:** `src/hooks/useManagementTabs.ts`  
**Lines:** 167  
**Status:** Active

## Purpose

Filters and organizes management tabs based on user permissions from `useManagementAccess`. Groups tabs into categories and returns the filtered set.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `useManagementTabs` | hook | Returns `{ availableTabs, tabsByCategory, getTabById, defaultTabId }` |
| `TAB_CATEGORIES` | constant | Category grouping for tabs |

## Return Shape

```typescript
{
  availableTabs: ManagementTab[],
  tabsByCategory: Record<string, ManagementTab[]>,
  getTabById: (id: string) => ManagementTab | undefined,
  defaultTabId: string
}
```
