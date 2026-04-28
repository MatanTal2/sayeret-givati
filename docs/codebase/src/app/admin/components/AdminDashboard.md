# AdminDashboard.tsx

**File:** `src/app/admin/components/AdminDashboard.tsx`
**Status:** Active

## Purpose

Tab navigation + tab content for the admin panel. Renders a tab strip (Add Personnel, Bulk Upload, View Personnel, Update Personnel, System Stats) and swaps between the tab components.

Top-bar / page-header chrome is no longer rendered here — admin pages are wrapped in `AppShell` (`src/app/admin/page.tsx`), which handles the top bar (with profile menu via `AuthButton`) and page title via `PageHeader`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLogout` | `() => void` | ✅ | Called after logout is confirmed via the global TopBar's profile menu |

## State

| State | Type | Purpose |
|-------|------|---------|
| `activeTab` | `AdminTabType` | Currently selected tab |

## RTL

Tab strip uses `gap-6` (direction-agnostic) instead of `space-x-8` (LTR-only). Logical-property spacing throughout (`ms-`, `me-`).
