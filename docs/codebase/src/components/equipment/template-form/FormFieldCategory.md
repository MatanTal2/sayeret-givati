# FormFieldCategory.tsx

**File:** `src/components/equipment/template-form/FormFieldCategory.tsx`  
**Lines:** 151  
**Status:** Active

## Styling

The select uses the shared `input-base` component class (defined in `src/app/globals.css`) with `max-w-sm` to cap width on wider viewports, and `text-sm` for label-sized text. This keeps the field consistent with the global form-input style — rounded `rounded-xl` corners, primary-500 focus ring — and prevents the dropdown from spanning the full grid column on desktop.

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
