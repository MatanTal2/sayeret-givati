# SelectAllCheckbox.tsx

**File:** `src/app/components/SelectAllCheckbox.tsx`
**Lines:** 34
**Status:** Active

## Purpose

Checkbox for selecting/deselecting all currently visible soldiers. Shows an indeterminate state when some (but not all) soldiers are selected.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `checked` | `boolean` | ✅ | Whether all are selected |
| `indeterminate` | `boolean` | ✅ | Partial selection state |
| `onChange` | `() => void` | ✅ | Toggle handler |
