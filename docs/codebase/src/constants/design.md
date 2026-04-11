# constants/design.ts

**File:** `src/constants/design.ts`  
**Lines:** 127  
**Status:** Active

## Purpose

TypeScript mirror of all design tokens from `tailwind.config.js` for use in JS/TS contexts (Framer Motion, dynamic styles, canvas, tests). Must stay in sync with Tailwind config.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `COLORS` | `const object` | All color palettes with hex values (primary, secondary, success, warning, danger, info, neutral) |
| `SHADOWS` | `const object` | Shadow definitions (soft, medium, strong, primary, primaryLg) |
| `BORDER_RADIUS` | `const object` | Border radius values |
| `SPACING` | `const object` | Custom spacing values |
| `ANIMATIONS` | `const object` | Animation definitions (fadeIn, slideUp, scaleIn, shimmer) with duration and easing |

## Notes

- Created as part of the design system pass (Phase 0).
- Should never contain values that differ from `tailwind.config.js`.
