# useSoldiers.ts

**File:** `src/hooks/useSoldiers.ts`  
**Lines:** 443 ⚠️ LONG  
**Status:** Active

## Purpose

Manages soldier data fetching (from `/api/sheets` endpoint), filtering, local modifications, and cache. The central hook for the status page.

## Return Shape

```typescript
{
  soldiers, filteredSoldiers, loading, error, lastUpdated,
  isRefreshing, isUpdatingChanges, isUpdatingServer,
  newSoldier, formErrors, filterState, debouncedNameFilter,
  selectedCount, changedSoldiers,
  // methods: fetchSoldiers, updateSoldier, addSoldier, toggleSelection, ...
}
```

## State

`soldiers`, `originalSoldiers`, `loading`, `error`, `lastUpdated`, `isRefreshing`, `isUpdatingServer`, `newSoldier` (form), `formErrors`, `filterState`, `debouncedNameFilter`

## Known Issues

- Hardcoded password `"admin123"` on line 258.
- 443 lines — candidate for split.
- Fetches from `/api/sheets` not Firestore — inconsistent with other hooks.
