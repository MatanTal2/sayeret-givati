# AdminDashboard.tsx

**File:** `src/app/admin/components/AdminDashboard.tsx`
**Status:** Active

## Purpose

Tab navigation + tab content for the admin panel. Renders a tab strip
(Add Personnel, Bulk Upload, **Personnel**, System Stats, System Config)
and swaps between the tab components.

Top-bar / page-header chrome is no longer rendered here — admin pages
are wrapped in `AppShell` (`src/app/admin/page.tsx`), which handles the
top bar (with profile menu via `AuthButton`) and page title via
`PageHeader`.

## Tab persistence

The active tab is read from and written to the URL query parameter
`?tab=<slug>` (matches the `/equipment` and `/ammunition` pattern). On
mount the dashboard reads `useSearchParams().get('tab')` and validates
it against the list of slugs in `ADMIN_TABS`; unknown / removed slugs
(e.g. the retired `update-personnel`) silently fall back to the default
`add-personnel` tab — there is no redirect.

Clicking a tab calls `router.replace(`?tab=${id}`, { scroll: false })`
so refreshing the page stays on the same tab and the URL is shareable.

Because `useSearchParams()` requires a Suspense boundary, the dashboard
exports a thin wrapper that mounts the actual content under `Suspense`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLogout` | `() => void` | yes | Called after logout is confirmed via the global TopBar's profile menu |

## RTL

Tab strip uses `gap-6` (direction-agnostic) instead of `space-x-8`
(LTR-only). Logical-property spacing throughout (`ms-`, `me-`).

## Related

- Personnel tab: `src/app/admin/components/PersonnelTab.tsx`
  (`docs/codebase/src/app/admin/components/PersonnelTab.md`)
- Tab catalog constants: `src/constants/admin.ts` (`ADMIN_TABS`)
- Tab slug union: `src/types/admin.ts` (`AdminTabType`)
