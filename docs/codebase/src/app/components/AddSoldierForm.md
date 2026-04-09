# AddSoldierForm.tsx

**File:** `src/app/components/AddSoldierForm.tsx`
**Lines:** 219
**Status:** Active

## Purpose

Collapsible form for adding a new soldier to the status page. Validates name, ID, and platoon fields before calling the `onSubmit` callback. Renders inline below the table header.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `newSoldier` | `NewSoldierForm` | ✅ | Controlled form values |
| `formErrors` | `{ name, id, platoon }` | ✅ | Field-level validation errors |
| `onFieldChange` | `(field: keyof NewSoldierForm, value: string) => void` | ✅ | Field update callback |
| `onSubmit` | `() => void` | ✅ | Form submission callback |
| `onCancel` | `() => void` | ✅ | Cancel/close callback |

## Notes

- Fully controlled component — no internal state.
- Status and custom-status fields included in the form (for setting initial status).
