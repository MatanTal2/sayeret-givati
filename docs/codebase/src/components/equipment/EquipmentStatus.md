# EquipmentStatus.tsx

**File:** `src/components/equipment/EquipmentStatus.tsx`  
**Lines:** 94  
**Status:** Active

## Purpose

Badge component that renders an equipment status value (`AVAILABLE`, `SECURITY`, `REPAIR`, `LOST`, `PENDING_TRANSFER`) as a colored pill. Supports `filled` and `outlined` variants and three sizes (`sm`, `md`, `lg`). Uses semantic color tokens: success for available, info for security, orange for repair, danger for lost, warning for pending transfer.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `EquipmentStatus` | ✅ | — | Status enum value |
| `size` | `'sm' \| 'md' \| 'lg'` | ❌ | `'md'` | Badge size |
| `variant` | `'filled' \| 'outlined'` | ❌ | `'filled'` | Visual style |

## Notes

- Uses `orange-*` colors for REPAIR status — `orange` is not in the token system (`tailwind.config.js`). See `docs/duplications.md`.
- Includes `dark:` mode classes but the app does not have a dark mode toggle.
- Text is sourced from `TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_*`.
- No state — pure display component.
