# ManagementHeader.tsx

**File:** `src/components/management/header/ManagementHeader.tsx`
**Status:** Active

## Purpose

Top header bar for the management dashboard. Visually mirrors the global `TopBar` (sticky, max-width container, brand logo centered, AuthButton on the end side) so the management page feels part of the same app shell. The mobile-only hamburger toggles the management sidebar (tabs), not the global app sidebar.

The active-tab `PageInfo` block (icon + title + description) is rendered as a sub-row immediately under the header.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `ManagementTab` | ❌ | Current tab; renders `PageInfo` sub-row when set |
| `sidebarOpen` | `boolean` | ✅ | Sidebar state — drives hamburger active styling |
| `onToggleSidebar` | `() => void` | ✅ | Toggle sidebar handler (mobile only) |

## Composes

- `next/image` for the shared brand logo (`/sayeret-givati-logo.png`)
- `next/link` for the home link
- `lucide-react` `Menu` icon for the hamburger
- `AuthButton` for profile + notifications
- `PageInfo` for the tab title row
