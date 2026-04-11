# FormFieldSubcategory.tsx

**File:** `src/components/equipment/template-form/FormFieldSubcategory.tsx`  
**Lines:** 158  
**Status:** Active

## Purpose

Subcategory selection dropdown, dependent on a selected category. Disabled when no category is selected. Includes an inline modal for creating a new subcategory via `CategoriesService.createSubcategory`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | ✅ | Selected subcategory ID |
| `onChange` | `(value: string) => void` | ✅ | Subcategory change handler |
| `subcategories` | `Subcategory[]` | ✅ | Available subcategories for selected category |
| `selectedCategoryId` | `string` | ✅ | Parent category ID (gates enabled state) |
| `onCategoriesRefresh` | `() => void` | ✅ | Refresh categories after add |
| `error` | `string` | ❌ | Validation error message |
| `disabled` | `boolean` | ❌ | Disable input |

## State

| State | Type | Purpose |
|-------|------|---------|
| `showAddModal` | `boolean` | Inline add-subcategory modal |
| `newSubcategoryName` | `string` | New subcategory name input |
| `isAdding` | `boolean` | Adding in progress |

## Firebase Operations

- **Write:** `CategoriesService.createSubcategory()` — writes to `subcategories` collection
