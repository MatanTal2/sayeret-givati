# FormFieldDefaultValues.tsx

**File:** `src/components/equipment/template-form/FormFieldDefaultValues.tsx`  
**Lines:** 57  
**Status:** Active

## Purpose

Two select dropdowns for default status and default condition when creating equipment from this template.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `defaultStatus` | `string` | ✅ | Default status value |
| `defaultCondition` | `string` | ✅ | Default condition value |
| `onStatusChange` | `(value: string) => void` | ✅ | Status change handler |
| `onConditionChange` | `(value: string) => void` | ✅ | Condition change handler |
| `disabled` | `boolean` | ❌ | Disable inputs |

## Notes

- These fields are not in the shared `TemplateFormData` type — type mismatch with types.ts.
