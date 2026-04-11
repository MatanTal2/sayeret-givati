# EquipmentList.tsx

**File:** `src/components/equipment/EquipmentList.tsx`  
**Lines:** 917 ⚠️ LONG  
**Status:** Active

## Purpose

Primary equipment table view with two tabs: "My Equipment" (filtered to the current user's held items) and "Additional Equipment" (role-filtered: team-only for USER/TEAM_LEADER, all equipment for MANAGER+). Handles search, multi-field filtering (status, condition, product name, holder, type, category, subcategory, serial), column-header sorting, row expansion, multi-select with select-all, and loading/error inline states.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `equipment` | `Equipment[]` | ✅ | Full equipment list (filtering happens client-side) |
| `loading` | `boolean` | ❌ | Show spinner instead of table |
| `error` | `string \| null` | ❌ | Show error message with optional refresh |
| `onTransfer` | `(equipmentId: string) => void` | ❌ | Opens transfer modal for a row |
| `onUpdateStatus` | `(equipmentId: string) => void` | ❌ | Opens status update modal for a row |
| `onViewHistory` | `(equipmentId: string) => void` | ❌ | Opens history/audit for a row |
| `onCredit` | `(equipmentId: string) => void` | ❌ | Credit action handler (placeholder) |
| `onRefresh` | `() => void` | ❌ | Retry button in error state |

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Global text search across id, productName, holder, category, location |
| `statusFilter` | `EquipmentStatus \| 'all'` | Status dropdown filter |
| `conditionFilter` | `EquipmentCondition \| 'all'` | Condition dropdown filter |
| `sortField` | `SortField` | Active sort column (`id`, `productName`, `currentHolder`, `status`, `lastReportUpdate`) |
| `sortOrder` | `SortOrder` | `'asc'` or `'desc'` |
| `expandedRows` | `Set<string>` | Equipment IDs with expanded detail row |
| `showProductNameFilter` | `boolean` | Column-header checkbox dropdown for product name |
| `showHolderFilter` | `boolean` | Column-header checkbox dropdown for holder |
| `selectedProductNames` | `string[]` | Multi-select product name filter |
| `selectedHolders` | `string[]` | Multi-select holder filter |
| `selectedEquipmentIds` | `Set<string>` | Rows checked for bulk action |
| `activeTab` | `'my-equipment' \| 'additional-equipment'` | Current view tab |
| `showAdvancedFilters` | `boolean` | Collapse state for advanced filter panel |
| `idFilter` | `string` | Additional-equipment tab ID text filter |
| `productNameFilter` | `string` | Additional-equipment tab product name text filter |
| `holderFilter` | `string` | Additional-equipment tab holder text filter |
| `typeFilter` | `string` | Equipment type text filter |
| `categoryFilter` | `string` | Category text filter |
| `subCategoryFilter` | `string` | Subcategory text filter |
| `dropdownPositions` | `object` | Pixel positions for portal-positioned filter dropdowns |

## Key Functions

| Function | Purpose |
|----------|---------|
| `getFilteredEquipment()` | Applies tab-based and role-based base filtering |
| `filteredAndSortedEquipment` | Derived list: base filter → all text/status/condition filters → sort |
| `handleSort(field)` | Toggles sort direction or sets new sort field |
| `getSortIcon(field)` | Returns Lucide icon for column header |
| `toggleRowExpansion(id)` | Adds/removes from `expandedRows` set |
| `toggleAllVisible()` | Select/deselect all visible rows |
| `formatDate(timestamp)` | Formats Firestore Timestamp or string to `he-IL` locale date |

## Permission Model

- `canManageEquipment` — from `hasEquipmentManagementAccess(enhancedUser)`
- `canPerformActions()` — always true on "my-equipment" tab; requires `canManageEquipment` on "additional-equipment" tab

## Notes

- 917 lines — candidate for split: filter logic, table rendering, and tab logic are distinct concerns.
- "My equipment" matching compares `currentHolder` against `uid`, full name `firstName + lastName`, and email — fragile, depends on how `currentHolder` was stored.
- Team filtering in "additional-equipment" for USER/TEAM_LEADER compares `assignedUnit === enhancedUser.role` — role field used as a team identifier which is unusual.
- Column-header filter dropdowns use `getBoundingClientRect()` for positioning — position state is recalculated on open.
- `onCredit` prop is wired in but no credit action UI is visible in the component.
