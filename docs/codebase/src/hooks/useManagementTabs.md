# useManagementTabs.ts

**File:** `src/hooks/useManagementTabs.ts`
**Status:** Active

## Purpose

Filters and organizes management tabs based on user permissions from `useManagementAccess`. Groups tabs into categories and returns the filtered set.

## Phase 7 tabs

Three new equipment-domain tabs registered:

| Tab id | Component | Gate |
|--------|-----------|------|
| `force-ops` | `ForceOperationsTab` | `isTeamLeaderOrAbove(user)` (per-item `canForceTransfer` enforced inside the tab and re-validated server-side) |
| `retirement-approval` | `RetirementApprovalTab` | `isManagerOrAbove(user) \|\| canBulkOps(user)` |
| `report-request` | `ReportRequestTab` | `isManagerOrAbove(user) \|\| canBulkOps(user)` |

Gating mixes `useManagementAccess.permissions` (UI-layout level) with direct `equipmentPolicy` imports (feature level) — by design, the policy module is the single source of truth for equipment actions.

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
