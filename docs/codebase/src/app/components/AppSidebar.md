# AppSidebar.tsx

**File:** `src/app/components/AppSidebar.tsx`
**Status:** Active

## Purpose

Primary navigation. Two distinct modes:

- **Desktop (`lg:` and up):** persistent icon rail on the start side (right in RTL). Collapsed width `w-16` shows icons only with hover tooltips; expanded width `w-64` also shows Hebrew labels. A chevron button at the top flips between modes. Expansion state is persisted in `localStorage` under key `sidebar_expanded`.
- **Mobile (below `lg:`):** rail is hidden. Hamburger in `TopBar` opens a full-width drawer (animated slide from the end side) with the same menu items.

Menu source: `getMenuItems()` from `src/utils/navigationUtils.ts`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mobileOpen` | `boolean` | ✅ | Controls mobile drawer visibility |
| `onMobileClose` | `() => void` | ✅ | Callback to close the drawer |

## Notes

- Active route is highlighted via `usePathname()`.
- Animations use Framer Motion (same pattern as the old `HamburgerMenu`).
