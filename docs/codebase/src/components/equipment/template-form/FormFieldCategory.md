# FormFieldCategory.tsx

**File:** `src/components/equipment/template-form/FormFieldCategory.tsx`  
**Lines:** 151  
**Status:** Active

## Purpose

Category selection dropdown with an inline "add new category" modal. Loads existing categories from props, displays them in a select dropdown, and provides a button + modal flow to create a new category via `CategoriesService.createCategory`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | ✅ | Selected category ID |
| `onChange` | `(value: string) => void` | ✅ | Category change handler |
| `categories` | `Category[]` | ✅ | Available categories |
| `onCategoriesRefresh` | `() => void` | ✅ | Refresh categories after add |
| `error` | `string` | ❌ | Validation error message |
| `disabled` | `boolean` | ❌ | Disable input |

## State

| State | Type | Purpose |
|-------|------|---------|
| `showAddModal` | `boolean` | Inline add-category modal |
| `newCategoryName` | `string` | New category name input |
| `isAdding` | `boolean` | Adding in progress |

## Firebase Operations

- **Write:** `CategoriesService.createCategory()` — writes to `categories` collection
