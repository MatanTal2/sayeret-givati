# TopBar.tsx

**File:** `src/app/components/TopBar.tsx`
**Status:** Active

## Purpose

Sticky top bar rendered by `AppShell`. Identical on every page.

Layout (RTL reading order): hamburger (+ optional back) → logo (links to `/`) → `AuthButton` (which embeds `NotificationBell` when signed in).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `showBackArrow` | `boolean` | — | Show back arrow next to hamburger; uses `router.back()` |
| `onOpenSidebar` | `() => void` | ✅ | Callback to open the mobile sidebar drawer |

## Notes

- Height 56px (`h-14`). `sticky top-0 z-40`.
- Uses `ArrowRight` from `lucide-react` for back (RTL-appropriate).
- The mobile sidebar drawer is owned by `AppShell` and toggled via `onOpenSidebar`.
