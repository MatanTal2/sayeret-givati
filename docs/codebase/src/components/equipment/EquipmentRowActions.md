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
