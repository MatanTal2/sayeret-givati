# EquipmentTemplateForm.tsx

**File:** `src/components/equipment/EquipmentTemplateForm.tsx`  
**Lines:** ~200  
**Status:** Active

## Purpose

Modal form for creating a new equipment template (type definition). Loads categories from `CategoriesService`, lets the user select category/subcategory, enter a name, description, notes, and toggle `requiresDailyStatusCheck`. Submits via `EquipmentTypesService.createEquipmentType`. Restricted to ADMIN, SYSTEM_MANAGER, and MANAGER roles.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `onSuccess` | `() => void` | ❌ | Called after successful template creation |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `TemplateFormData` | All template fields |
| `errors` | `FormErrors` | Per-field validation errors |
| `isSubmitting` | `boolean` | Submit in progress |
| `categories` | `Category[]` | Loaded from `CategoriesService` |
| `categoriesLoading` | `boolean` | Categories loading state |
| `categoriesError` | `string` | Categories load error |

## Firebase Operations

- **Read:** `CategoriesService.getCategories()` — reads `categories` + `subcategories` collections
- **Write:** `EquipmentTypesService.createEquipmentType()` — writes to `equipmentTemplates` collection

## Decomposed Sub-Components

Uses imported sub-components from `./template-form/`:
- `FormHeader`
- `FormFieldCategory`
- `FormFieldSubcategory`
- `FormFieldRequiresDailyCheck`
- `FormActions`

Types and `initialFormData` imported from `./template-form/types`.

## Notes

- Permission check is UI-only (`hasPermission`) — no server-side enforcement.
- Categories error handling is graceful: treats permissions errors or load failures as empty arrays.
- Resets form data when modal opens/closes.
