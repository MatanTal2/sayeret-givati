# categories/repository.ts

**File:** `src/lib/categories/repository.ts`  
**Lines:** 357 ⚠️ LONG  
**Status:** Active

## Purpose

Firestore data access layer for categories and subcategories. Implements CRUD, queries, ordering, and batch operations. Uses soft-delete pattern (sets `isActive: false` instead of deleting documents).

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `CategoriesRepository` | class (static) | 14 methods below |

## Methods

| Method | Description |
|--------|-------------|
| `getCategories(options?)` | Read all categories |
| `getSubcategories(options?)` | Read all/filtered subcategories |
| `getCategoryById(id)` | Read single category |
| `getSubcategoryById(id)` | Read single subcategory |
| `categoryExists(id)` | Check existence |
| `subcategoryExists(id)` | Check existence |
| `createCategory(data)` | Write new category |
| `createSubcategory(data)` | Write new subcategory |
| `updateCategory(id, updates)` | Update category |
| `updateSubcategory(id, updates)` | Update subcategory |
| `getNextCategoryOrder()` | Calculate next order value |
| `getNextSubcategoryOrder(parentId)` | Calculate next order within parent |
| `deactivateCategory(id)` | Batch: deactivate category + all child subcategories |
| `deactivateSubcategory(id)` | Deactivate single subcategory |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `categories` | `getDocs`, `query` | `getCategories()`, `getNextCategoryOrder()` |
| `categories` | `getDoc` | `getCategoryById()`, `categoryExists()` |
| `categories` | `setDoc` | `createCategory()` |
| `categories` | `updateDoc` | `updateCategory()` |
| `categories` | `writeBatch` | `deactivateCategory()` (parent + children atomically) |
| `subcategories` | `getDocs`, `query` | `getSubcategories()`, `getNextSubcategoryOrder()` |
| `subcategories` | `getDoc` | `getSubcategoryById()`, `subcategoryExists()` |
| `subcategories` | `setDoc` | `createSubcategory()` |
| `subcategories` | `updateDoc` | `updateSubcategory()`, `deactivateSubcategory()` |

## Notes

- Filtering done in-memory to avoid Firestore composite index requirements — TODO to add proper indexes.
- 357 lines — at the split threshold.
