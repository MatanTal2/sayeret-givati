# page.tsx (Admin)

**File:** `src/app/admin/page.tsx`
**Status:** Active

## Purpose

Admin section entry point (`/admin`). Routes to `AdminLogin` or `AdminDashboard` based on authentication state from `useAdminAuth`. Shows a spinner inside `AppShell` while auth state is loading.

When authenticated, the dashboard is wrapped in `AppShell` (top bar + sidebar + page header) so the admin panel matches the rest of the app and reuses the profile/avatar menu via `AuthButton`. The login screen renders standalone (no shell) — the user has no profile yet at that point.

## Exports / Public API

- `default AdminPage` — no props.

## Notes

- The `onLoginSuccess` / `onLogout` callbacks are no-ops; auth state is fully managed by `useAdminAuth` internally.
- Loading spinner uses `info-600` color (legacy) — could be aligned to `primary-600` in a follow-up sweep.
