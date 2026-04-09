# EquipmentLoadingState.tsx

**File:** `src/components/equipment/EquipmentLoadingState.tsx`  
**Lines:** 87  
**Status:** Active

## Purpose

Skeleton loading state for the equipment grid. Shows a spinner with loading text and a configurable number of pulsing placeholder cards in a responsive grid (1/2/3 columns). Each skeleton card mimics the real card layout: header, content grid, and action buttons.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `count` | `number` | ❌ | `6` | Number of skeleton cards to show |
| `compact` | `boolean` | ❌ | `false` | Smaller card padding |

## Notes

- No state — pure display component.
- Uses Tailwind `animate-pulse` for skeleton effect.
