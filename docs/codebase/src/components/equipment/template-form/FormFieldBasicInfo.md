# FormFieldBasicInfo.tsx

**File:** `src/components/equipment/template-form/FormFieldBasicInfo.tsx`  
**Lines:** 83  
**Status:** Active

## Purpose

Collects template name, ID prefix (max 6 chars), and description text area.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Template name value |
| `description` | `string` | ✅ | Description value |
| `idPrefix` | `string` | ✅ | ID prefix value (max 6 chars) |
| `onNameChange` | `(value: string) => void` | ✅ | Name change handler |
| `onDescriptionChange` | `(value: string) => void` | ✅ | Description change handler |
| `onIdPrefixChange` | `(value: string) => void` | ✅ | Prefix change handler |
| `errors` | `FormErrors` | ✅ | Validation error messages |
| `disabled` | `boolean` | ❌ | Disable all inputs |

## Notes

- `idPrefix` and `description` fields are not in the `TemplateFormData` type — see types.ts mismatch.
