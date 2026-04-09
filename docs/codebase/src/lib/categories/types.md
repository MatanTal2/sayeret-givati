# categories/types.ts

**File:** `src/lib/categories/types.ts`  
**Lines:** 88  
**Status:** Active

## Purpose

Type definitions for the categories module: interfaces for Category, Subcategory, DTOs for create/update operations, service result types, and query options.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `Category` | interface | Category with id, name, subcategories, order, isActive, timestamps |
| `Subcategory` | interface | Subcategory with id, name, parentCategoryId, order, isActive, timestamps |
| `CreateCategoryData` / `CreateSubcategoryData` | interface | DTOs for creation |
| `UpdateCategoryData` / `UpdateSubcategoryData` | interface | DTOs for updates |
| `CategoriesServiceResult<T>` | interface | Generic result `{ success, data?, error?, message? }` |
| `CategoriesListResult` / `SubcategoriesListResult` | type | Typed result aliases |
| `CategoriesQueryOptions` / `SubcategoriesQueryOptions` | interface | Query filtering options |
