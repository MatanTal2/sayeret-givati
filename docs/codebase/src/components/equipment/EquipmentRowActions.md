# EquipmentRowActions

**File:** `src/components/equipment/EquipmentRowActions.tsx`

Per-row action dropdown for the equipment table. Items in the menu are gated through `equipmentPolicy`:

| Item | Gate |
|------|------|
| Report | `canReport` |
| Transfer | `canTransfer` (only the current holder can request) |
| Return | `canRetire` (only the signer) — rendered with danger styling |
| History | always visible |

The gating decides menu visibility; the page still controls dispatch (the component just emits `onAction(kind)`). No mutation lives here.

## Layout

Built on Headless UI `Menu` + `MenuItems` with `anchor="bottom end"`. `anchor` portals the panel through Floating UI, so it escapes the parent row's `overflow-hidden` (bug #17). Items split into two groups: safe (`report`, `transfer`, `history`) on top, destructive (`return`) on the bottom. A `border-t` divider renders between them when both groups are non-empty.
