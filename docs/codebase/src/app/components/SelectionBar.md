# SelectionBar.tsx

**File:** `src/app/components/SelectionBar.tsx`
**Lines:** 100
**Status:** Active

## Purpose

Floating action bar that appears when one or more soldiers are selected. Shows a count of selected soldiers and action buttons (change status, deselect all, delete selected). Only renders when `selectedCount > 0`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedCount` | `number` | ✅ | Number of currently selected soldiers |
| `onStatusChange` | `(status: string) => void` | ✅ | Apply status change to all selected |
| `onDeselectAll` | `() => void` | ✅ | Clear selection |
| `onDeleteSelected` | `() => void` | ✅ | Delete all selected |
