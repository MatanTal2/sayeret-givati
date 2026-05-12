# AppShell.tsx

**File:** `src/app/components/AppShell.tsx`
**Status:** Active

## Purpose

App-wide shell that wraps every top-level page. Renders the sticky `TopBar`, the `AppSidebar` (two-stage rail on desktop, drawer on mobile), the `PageHeader` (title + subtitle), the page `children`, and the mobile `QuickActionFab`.

Replaces the per-page `Header` component that was removed. Pages opt in by wrapping their content in `<AppShell>` instead of composing their own header manually.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ | Page headline shown below the top bar |
| `subtitle` | `string` | — | Optional one-line description |
| `showBackArrow` | `boolean` | — | Show back arrow in the top bar (default `false`). Use on deep routes like `/tools/convoy` |
| `showFab` | `boolean` | — | Show the mobile floating action button (default `true`) |
| `hidePageHeader` | `boolean` | — | Skip rendering `PageHeader` (default `false`). Use when the page draws its own sub-bar, e.g. embedded-iframe tool pages |
| `mainClassName` | `string` | — | Override `<main>` class string. Default `flex-1 px-4 sm:px-6 pb-24 lg:pb-12`. Use `flex-1 flex flex-col min-h-0` for full-bleed flex layouts (iframes that should fill remaining height) |
| `children` | `ReactNode` | ✅ | Page body |

## Layout

- `min-h-screen` column: top bar → content row.
- Content row: sidebar rail (lg+) on the start side + main content column.
- Main column: `PageHeader` + scrollable `<main>` with `children`.
- FAB is fixed bottom-end, visible only on `<lg`.

## Onboarding gate

Renders `WelcomeModal` when `enhancedUser` exists, has `firstName`+`lastName`, lacks `teamId`, and no registration flow is in flight. Suppressed on `/admin/*` so admins can reach System Config and populate the teams list — otherwise the bootstrap admin (no `teamId` yet) is locked out of the only place that defines teams.
