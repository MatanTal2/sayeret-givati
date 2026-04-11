# layout.tsx (Admin)

**File:** `src/app/admin/layout.tsx`
**Lines:** 20
**Status:** Active

## Purpose

Admin section layout wrapper. Applies a neutral-100 background, centered container, and a top-level "System Admin Panel" heading in English. Uses `dir="ltr"` — the admin panel is intentionally left-to-right (English UI), unlike the rest of the app which is RTL Hebrew.

## Exports / Public API

- `default AdminLayout` — accepts `children: ReactNode`.

## Notes

- `dir="ltr"` here intentionally overrides the root `dir="rtl"`. Admin is an English-language internal panel.
- Dark mode classes (`dark:bg-neutral-900`, `dark:text-white`) are present but dark mode is not implemented app-wide.
