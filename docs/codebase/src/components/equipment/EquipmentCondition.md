# EquipmentCondition.tsx

**File:** `src/components/equipment/EquipmentCondition.tsx`  
**Lines:** 98  
**Status:** Active

## Purpose

Badge component for equipment condition (`GOOD`, `NEEDS_REPAIR`, `WORN`). Displays a colored pill with an optional emoji icon (👍, 🔧, ⚠️). Supports `filled`/`outlined` variants and three sizes.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `condition` | `EquipmentCondition` | ✅ | — | Condition enum value |
| `size` | `'sm' \| 'md' \| 'lg'` | ❌ | `'md'` | Badge size |
| `showIcon` | `boolean` | ❌ | `true` | Show emoji icon |
| `variant` | `'filled' \| 'outlined'` | ❌ | `'filled'` | Visual style |

## Notes

- Uses dynamic Tailwind class construction (`bg-${color}-100`), which requires the colors to exist in the safelist or be otherwise pre-generated — risky with JIT purging.
- Maps GOOD→blue, NEEDS_REPAIR→red, WORN→yellow — these are Tailwind built-in colors, not the custom token palette.
- `dark:` mode classes included but no dark mode toggle in the app.
- No state — pure display component.
