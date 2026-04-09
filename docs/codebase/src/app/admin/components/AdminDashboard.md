# AdminDashboard.tsx

**File:** `src/app/admin/components/AdminDashboard.tsx`
**Lines:** 125
**Status:** Active

## Purpose

Main admin dashboard shell. Renders a tab-navigation header with 5 tabs (Add Personnel, Bulk Upload, View Personnel, Update Personnel, System Stats) and swaps between the tab components. Manages logout confirmation via `ConfirmationModal`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLogout` | `() => void` | ✅ | Called after logout is confirmed |

## State

| State | Type | Purpose |
|-------|------|---------|
| `activeTab` | `AdminTabType` | Currently selected tab |
