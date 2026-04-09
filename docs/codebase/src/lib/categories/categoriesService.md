# categories/categoriesService.ts

**File:** `src/lib/categories/categoriesService.ts`  
**Lines:** 344 ⚠️ LONG  
**Status:** Active

## Purpose

Business logic layer for category and subcategory management. Validates inputs, delegates Firestore operations to `CategoriesRepository`, and returns standardized results. Handles errors gracefully — returns empty arrays on failures rather than throwing.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `CategoriesService` | class (static) | 8 methods below |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCategories` | `(options?) => Promise<CategoriesListResult>` | Fetch all categories with subcategories |
| `getSubcategories` | `(categoryId, options?) => Promise<SubcategoriesListResult>` | Fetch subcategories for a category |
| `createCategory` | `(data, createdBy?) => Promise<CategoryResult>` | Create new category |
| `createSubcategory` | `(parentId, data, createdBy?) => Promise<SubcategoryResult>` | Create new subcategory |
| `updateCategory` | `(id, updates) => Promise<CategoriesServiceResult>` | Update category |
| `updateSubcategory` | `(id, updates) => Promise<CategoriesServiceResult>` | Update subcategory |
| `deactivateCategory` | `(id) => Promise<CategoriesServiceResult>` | Soft delete category |
| `deactivateSubcategory` | `(id) => Promise<CategoriesServiceResult>` | Soft delete subcategory |

## Notes

- Delegates all Firestore access to `CategoriesRepository`.
- Returns empty arrays on errors (may mask failures).
