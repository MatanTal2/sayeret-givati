# DailyStatusBadge.tsx

**File:** `src/components/equipment/DailyStatusBadge.tsx`  
**Lines:** 66  
**Status:** Active

## Purpose

Badge that indicates equipment requires daily status checks. Renders nothing if `requiresDailyStatusCheck` is false. Shows a 📊 icon with text from `TEXT_CONSTANTS`. Uses `orange-*` colors.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `requiresDailyStatusCheck` | `boolean` | ✅ | — | Whether to render the badge at all |
| `size` | `'sm' \| 'md' \| 'lg'` | ❌ | `'md'` | Badge size |
| `variant` | `'filled' \| 'outlined'` | ❌ | `'filled'` | Visual style |

## Notes

- Uses `orange-*` Tailwind colors which are not in the custom token system.
- No state — pure display component.
