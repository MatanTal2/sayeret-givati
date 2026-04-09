# EquipmentCard.tsx

**File:** `src/components/equipment/EquipmentCard.tsx`  
**Lines:** 158  
**Status:** Active

## Purpose

Card-view representation of a single equipment item. Displays a horizontal layout with a category emoji icon, basic info (serial, product name, category), key details grid (holder, unit, location, time ago), and status/condition/daily-check badges with action buttons. Supports a `compact` mode with smaller padding.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `equipment` | `Equipment` | ✅ | — | Equipment item to render |
| `onTransfer` | `(equipmentId: string) => void` | ❌ | — | Transfer button handler |
| `onUpdateStatus` | `(equipmentId: string) => void` | ❌ | — | Update button handler |
| `onViewHistory` | `(equipmentId: string) => void` | ❌ | — | History button handler |
| `compact` | `boolean` | ❌ | `false` | Smaller card size |

## Key Functions

| Function | Purpose |
|----------|---------|
| `formatTimeAgo(timestamp)` | Converts Firestore Timestamp or string to "X hours/days ago" using `TEXT_FMT.HOURS_AGO` / `TEXT_FMT.DAYS_AGO` |
| `getCategoryIcon(category)` | Maps Hebrew category keywords to emoji icons (weapon→🔫, optics→🔭, comms→📡, defense→🛡️, gear→🎒, default→⚙️) |
| `getCardStyling()` | Returns neutral gradient — currently hardcoded, not dynamic based on status |

## Known Issues / TODO

- Inline Hebrew string `'זמן לא ידוע'` in `formatTimeAgo` catch block — should be in `TEXT_CONSTANTS`.
- Inline Hebrew button labels `'העבר'` and `'עדכן'` — should be in `TEXT_CONSTANTS`.
- `getCardStyling()` always returns neutral — status-based coloring is not implemented.
- No state — pure display component.
