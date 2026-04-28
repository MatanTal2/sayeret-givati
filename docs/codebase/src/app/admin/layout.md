# layout.tsx (Admin)

**File:** `src/app/admin/layout.tsx`
**Status:** Active

## Purpose

Passthrough wrapper. The admin section now reuses the global `AppShell` (top bar with profile menu, sidebar, page header) — applied at the page level (`src/app/admin/page.tsx`) rather than at this layout. The layout itself does no styling and inherits the root `dir="rtl"`.

## Exports / Public API

- `default AdminLayout` — accepts `children: ReactNode`.

## Notes

- Previously bypassed RTL with `dir="ltr"` and an English header. That has been removed; the admin panel now follows the app-wide RTL Hebrew direction.
