# categories/utils.ts

**File:** `src/lib/categories/utils.ts`  
**Lines:** 108  
**Status:** Active

## Purpose

Pure utility functions for validation, sorting, grouping, and data transformation within the categories domain.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `isHebrewText` | `(text: string) => boolean` | Checks if text contains Hebrew characters |
| `groupSubcategoriesByParent` | `(subs: Subcategory[]) => Map<string, Subcategory[]>` | Groups subcategories by parentCategoryId |
| `mergeCategoriesWithSubcategories` | `(cats, subsMap) => Category[]` | Attaches subcategories to their parent categories |
| `sortByOrderAndName` | `<T>(items: T[]) => T[]` | Sorts by `order` then `name` |
| `validateName` | `(name: string) => { isValid, error? }` | Name validation |
| `createErrorResult` | `(error, message?) => object` | Standardized error result |
| `createSuccessResult` | `<T>(data?, message?) => object` | Standardized success result |
