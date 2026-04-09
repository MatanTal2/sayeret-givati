# page.tsx (Admin)

**File:** `src/app/admin/page.tsx`
**Lines:** 35
**Status:** Active

## Purpose

Admin section entry point (`/admin`). Routes to `AdminLogin` or `AdminDashboard` based on authentication state from `useAdminAuth`. Shows a spinner while auth state is loading.

## Exports / Public API

- `default AdminPage` — no props.

## Notes

- `handleLoginSuccess` and `handleLogout` callbacks are no-ops. Auth state is fully managed by `useAdminAuth` and `AdminDashboard` internally.
- Loading spinner uses `info-600` color instead of `primary-600` — inconsistency with the rest of the app.
