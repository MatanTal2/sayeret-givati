# StatusToggle.tsx

**File:** `src/app/components/StatusToggle.tsx`
**Lines:** 68
**Status:** Active

## Purpose

Inline status selector for a single soldier row. Renders a dropdown with the three structured statuses (home, guard, other) plus a custom text input that appears when "other" is selected.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `soldier` | `Soldier` | ✅ | Soldier whose status is being edited |
| `onChange` | `(id: string, status: string) => void` | ✅ | Status change callback |
