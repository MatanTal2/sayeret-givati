# SoldiersTableDesktop.tsx

**File:** `src/app/components/SoldiersTableDesktop.tsx`
**Lines:** 274
**Status:** Active

## Purpose

Responsive desktop table for the soldier status page. Renders soldiers in a `<table>` with columns for selection checkbox, ID, name, rank, platoon, status (editable via `StatusToggle`), and an actions menu. Supports multi-select, inline status editing, and per-row actions (edit, delete).

A 2px registration dot renders before the name: `bg-success-500` when `soldier.isRegistered`, `bg-neutral-300` otherwise. Tooltip text from `TEXT_CONSTANTS.STATUS_PAGE.REGISTERED_TOOLTIP` / `UNREGISTERED_TOOLTIP`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `soldiers` | `Soldier[]` | ✅ | Filtered soldiers to display |
| `selectedSoldiers` | `Set<string>` | ✅ | Currently selected soldier IDs |
| `onToggleSelect` | `(id: string) => void` | ✅ | Toggle single row selection |
| `onStatusChange` | `(id: string, status: string) => void` | ✅ | Inline status change |
| `onEdit` | `(soldier: Soldier) => void` | ✅ | Open edit for soldier |
| `onDelete` | `(id: string) => void` | ✅ | Delete soldier |
| `onSelectAll` | `() => void` | ✅ | Select all visible |
| `allSelected` | `boolean` | ✅ | Whether all visible rows are selected |
