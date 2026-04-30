# AmmunitionInventoryView

**File:** `src/components/ammunition/AmmunitionInventoryView.tsx`
**Status:** Active.

## Purpose

Pure presentation. Renders inventory grouped by template, then by tracking
mode, with a top section for live entries and a bottom greyed section for
"used" items (CONSUMED / RETURNED / LOST / DAMAGED). Tables, not cards.

Used by:

- `/ammunition` page — scope tabs (personal / team / all).
- `PersonalAmmunitionSection` on `/equipment` — USER-allocated holdings of
  the current user (no actions).
- `TeamAmmunitionSection` on `/equipment` — own team holdings (no actions).

## Props

| Prop | Purpose |
|------|---------|
| `templates` | Full template list. The view groups by template id. |
| `stock` | Raw `AmmunitionStock[]` (BRUCE / LOOSE_COUNT). |
| `items` | Raw `AmmunitionItem[]` (SERIAL). |
| `filter?` | `{ holderType?, holderId? }` — narrow the scope shown. |
| `showHolder?` | When true, each row shows the holder. |
| `resolveHolderName?` | Optional formatter for holder labels. Falls back to `${type}:${id}`. |
| `canMutate?` | Per-row predicate. When true, transfer + return-to-mgr buttons render where applicable. Server re-validates. |
| `canDeleteRow?` | Per-row predicate for the delete button. Defaults to `canMutate`. The `/ammunition` page restricts this to admin / system_manager. |
| `onDeleteStock` / `onDeleteItem` | Delete mutators. Confirm dialog appears before each call. |
| `onTransferItem(item)` | Transfer button click. Parent typically opens `TransferAmmoItemModal`. AVAILABLE serial items only. |
| `onReturnItemToMgr(item)` | Return-to-ammo-manager click. Confirm dialog appears. CONSUMED serial items only. Server flips status to RETURNED and reassigns the holder to `systemConfig.ammoNotificationRecipientUserId`. |

## Layout

- One bordered group per template, header showing name / subcategory /
  tracking mode / security level.
- BRUCE / LOOSE_COUNT: stock table — qty + (optional) holder + delete.
- SERIAL: top table = AVAILABLE items (full opacity), bottom greyed table
  = CONSUMED + RETURNED + LOST + DAMAGED.

## Per-row action matrix (SERIAL)

| Status      | Actions visible                                          |
|-------------|----------------------------------------------------------|
| AVAILABLE   | Transfer (canMutate) + Delete (canDeleteRow)             |
| CONSUMED    | Return-to-mgr (canMutate)                                |
| RETURNED / LOST / DAMAGED | (none — read-only)                          |

## Notes

- The view is data-only — the parent owns refresh + permission policy.
- Confirmation dialogs use `window.confirm` for simplicity. Promote to a
  proper modal if/when other UI requires it.
- Empty state: when the filter yields zero rows the empty card replaces
  the entire list. Per-template empty groups are hidden.
