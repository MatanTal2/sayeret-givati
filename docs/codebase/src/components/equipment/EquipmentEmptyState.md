# EquipmentEmptyState.tsx

**File:** `src/components/equipment/EquipmentEmptyState.tsx`  
**Lines:** 63  
**Status:** Active

## Purpose

Empty state display for the equipment section. Shows a large emoji icon, a title, description, optional action button, and a search tip when `isFiltered` is true. All text defaults are from `TEXT_CONSTANTS` but can be overridden via props.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ❌ | Context-dependent default | Override title |
| `description` | `string` | ❌ | Context-dependent default | Override description |
| `actionText` | `string` | ❌ | — | Button label (button only renders if this + `onAction` provided) |
| `onAction` | `() => void` | ❌ | — | Button click handler |
| `icon` | `string` | ❌ | `'📦'` | Emoji icon |
| `isFiltered` | `boolean` | ❌ | `false` | Whether this empty state is due to active filters (changes defaults + shows tip) |

## Notes

- No state — pure display component.
