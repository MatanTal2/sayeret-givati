# categoriesService.ts

**File:** `src/lib/categoriesService.ts`  
**Lines:** 14  
**Status:** Deprecated (wrapper)

## Purpose

Backward-compatibility re-export wrapper for the refactored categories module at `./categories/`. All imports are re-exported unchanged.

## Exports

Re-exports from `./categories`:
- `CategoriesService`
- `Category`, `Subcategory`
- `CreateCategoryData`, `CreateSubcategoryData`
- `CategoriesServiceResult`

## Notes

- Marked `@deprecated` — consumers should import from `@/lib/categories` directly.
