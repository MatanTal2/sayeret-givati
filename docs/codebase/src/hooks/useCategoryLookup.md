# useCategoryLookup.ts

**File:** `src/hooks/useCategoryLookup.ts`
**Status:** Active

## Purpose

`EquipmentType.category` and `EquipmentType.subcategory` are stored as
Firestore doc IDs, not human-readable names. List views that need to
display the names — e.g. `TemplatesTab` — would otherwise render raw
IDs. This hook loads the categories tree once via
`CategoriesService.getCategories()` and exposes O(1) lookups for both.

## Return shape

```ts
{
  categoryName: (id: string) => string | null,
  subcategoryName: (id: string) => string | null,
  isLoading: boolean,
}
```

`null` is returned when an ID has no match (deleted category, dirty
data, or still loading). Callers should fall back to rendering the raw
ID in a warning style so the orphan ref is visible rather than silent.

## Notes

- One network read per consumer. If the hook ends up mounted in many
  places at once, hoist to a context or a SWR-like cache.
- Built on the existing `CategoriesService` (`src/lib/categoriesService.ts`,
  re-export of `src/lib/categories/categoriesService.ts`).
