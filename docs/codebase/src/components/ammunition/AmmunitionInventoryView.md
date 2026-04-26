# AmmunitionInventoryView

**File:** `src/components/ammunition/AmmunitionInventoryView.tsx`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Pure presentation. Renders inventory grouped by template with a per-tracking-mode
formatter. Used by:

- `/ammunition` (user page) — own + team holdings.
- `AmmunitionInventorySection` (management) — all holdings.
- `PersonalAmmunitionSection` (`/equipment`) — USER-allocated holdings of the
  current user.

## Props

| Prop | Purpose |
|------|---------|
| `templates` | Full template list. The view groups by template id. |
| `stock` | Raw `AmmunitionStock[]` (BRUCE / LOOSE_COUNT). |
| `items` | Raw `AmmunitionItem[]` (SERIAL). |
| `filter?` | `{ holderType?, holderId? }` — narrow the scope shown. |
| `showHolder?` | When true, each row shows the holder. Used in management. |
| `resolveHolderName?` | Optional formatter for holder labels. Falls back to `${type}:${id}`. |
| `canMutate?` | Per-row predicate. When true, the trash button renders. |
| `onDeleteStock` / `onDeleteItem` | Mutators. Called when the user clicks the trash button. |

## Per tracking mode

- `BRUCE` — `{count} ברוסים` plus an "open: {state}" suffix when not EMPTY.
- `LOOSE_COUNT` — `{quantity} יח'`.
- `SERIAL` — list of serials with a status label.

## Notes

- Empty state shows once across all templates — if the filter yields no rows
  the empty card replaces the entire list. Per-template empty groups are
  hidden.
- The view is data-only — the parent owns refresh + permission policy.
