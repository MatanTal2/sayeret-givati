# EquipmentModal.tsx

**File:** `src/components/equipment/EquipmentModal.tsx`  
**Lines:** ~300  
**Status:** Active

## Purpose

Dual-mode modal for creating or updating equipment items. In `create` mode, all fields are editable. In `update` mode, only `status`, `condition`, `location`, and `notes` are editable — other fields are read-only. Validates the form and calls `onSubmit` (create) or `onUpdate` (update) with the appropriate data shape.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `onSubmit` | `(equipment: Omit<Equipment, 'createdAt' \| 'updatedAt' \| 'trackingHistory'>) => Promise<void>` | ❌ | Create mode submit |
| `onUpdate` | `(equipmentId: string, updates: Partial<Equipment>) => Promise<void>` | ❌ | Update mode submit |
| `loading` | `boolean` | ❌ | External loading state |
| `mode` | `'create' \| 'update'` | ❌ | Modal mode (default: `'create'`) |
| `existingEquipment` | `Equipment` | ❌ | Pre-populate form in update mode |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `FormData` | All form fields |
| `errors` | `Record<string, string>` | Per-field errors |
| `isSubmitting` | `boolean` | Submit in progress |

## Key Functions

| Function | Purpose |
|----------|---------|
| `isFieldEditable(fieldName)` | Returns `true` in create mode; restricts to `status`, `condition`, `location`, `notes` in update mode |
| `validateForm()` | Full validation for create; only editable fields validated for update |
| `handleFieldChange(field, value)` | Prevents changes to read-only fields in update mode |

## Notes

- Shares the same `FormData` interface with `AddEquipmentModal` — duplication.
- Simpler than `AddEquipmentModal` (no template selection, no searchable dropdowns).
- Uses `useAuth()` for the `enhancedUser` context.
