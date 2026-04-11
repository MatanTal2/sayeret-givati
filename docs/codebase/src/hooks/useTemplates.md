# useTemplates.ts

**File:** `src/hooks/useTemplates.ts`  
**Lines:** 251  
**Status:** Active

## Purpose

Fetches and caches equipment templates from Firestore with category/subcategory name resolution. Uses a 5-minute module-level cache.

## Return Shape

```typescript
{
  templates: EquipmentType[],
  templatesByCategory: Record<string, EquipmentType[]>,
  loading, error,
  refreshTemplates, refreshCategories, invalidateCache
}
```

## Firebase Operations

- **Read:** `EquipmentTypesService.getTemplates()` — reads `equipmentTemplates`
- **Read:** `CategoriesService.getCategories()` — reads `categories` + `subcategories`

## Notes

- Module-level cache variables not cleared on unmount.
- 5-minute TTL for both templates and categories caches.
