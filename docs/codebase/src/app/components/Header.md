# Header.tsx

**File:** `src/app/components/Header.tsx`
**Lines:** 122
**Status:** Active

## Purpose

Shared page header used across all main pages. Renders the app logo (links back to home), a page title and subtitle, an `AuthButton`, and a `HamburgerMenu`. Layout is responsive: mobile uses a stacked vertical layout; desktop uses a three-column row (hamburger | logo | auth).

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ✅ | — | Page title displayed in h1 |
| `subtitle` | `string` | ✅ | — | Subtitle below title (mobile only) |
| `backLink` | `string` | ❌ | `"/"` | URL for logo click and back link |
| `backText` | `string` | ❌ | `"← חזרה לעמוד הבית"` | Back link text |
| `showAuth` | `boolean` | ❌ | `true` | Show `AuthButton`; if false, shows `backLink` instead |

## Notes

- Subtitle is only rendered in mobile layout. Desktop shows title only.
- Menu items come from `navigationUtils.getMenuItems()` — centralized navigation config.
