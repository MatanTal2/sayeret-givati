# FormActions.tsx

**File:** `src/components/equipment/template-form/FormActions.tsx`  
**Lines:** 43  
**Status:** Active

## Purpose

Save/Cancel button pair for the template form. Disables save when `isSubmitting` or `!canSubmit`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onCancel` | `() => void` | ✅ | Cancel button handler |
| `onSubmit` | `() => void` | ✅ | Save button handler |
| `isSubmitting` | `boolean` | ✅ | Disables buttons and shows spinner |
| `canSubmit` | `boolean` | ✅ | Gates save button enabled state |
