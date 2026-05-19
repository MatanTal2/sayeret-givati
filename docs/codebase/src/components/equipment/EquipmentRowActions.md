# EquipmentRowActions

**File:** `src/components/equipment/EquipmentRowActions.tsx`

Per-row action dropdown for the equipment table. Items in the menu are gated through `equipmentPolicy`:

| Item | Gate |
|------|------|
| Report | `canReport` |
| Transfer | `isHolder(ctx) && equipment.status !== RETIRED` (inline — see "Disabled rows + info bubbles" below) |
| Request exchange / Approve exchange / Replace by another | `canRequestExchange` / `canApproveExchange` / `canReplaceByAnother` |
| Send to storage | `canSendToStorage` |
| Pull from storage | `canPullFromStorage` |
| History | always visible |
| Reject exchange | `canApproveExchange` (danger) |
| Return | `canRetire` — danger styling |

The gating decides menu visibility; the page still controls dispatch (the component just emits `onAction(kind)`). No mutation lives here.

## Layout

Built on Headless UI `Menu` + `MenuItems` with `anchor="bottom end"`. `anchor` portals the panel through Floating UI, so it escapes the parent row's `overflow-hidden` (bug #17). Items split into two groups: safe on top, destructive on the bottom. A `border-t` divider renders between them when both groups are non-empty.

## Disabled rows + info bubbles

Some rows render in a disabled state with a `?` info bubble (`InfoPopover`) that explains why. The bubble lives inside the same `MenuItem` flex row, immediately after the label, with `pe-2` spacing.

| Row | Disabled when | Bubble text |
|---|---|---|
| Transfer | `equipment.status === STORED` | `STORAGE.TRANSFER_BLOCKED_STORED_TOOLTIP` |
| Pull from storage | `!roundOpen` (parent reads `SystemConfig.roundOpen`) | `STORAGE.ROUND_CLOSED_TOOLTIP` |

Transfer visibility is intentionally inline (`isHolder(ctx) && status !== RETIRED`) and does NOT call `equipmentPolicy.canTransfer`. The server still uses `canTransfer`, which hides STORED items, but the UI wants a visible affordance with a bubble explaining the path forward ("pull from storage first"). Server-side enforcement is unchanged.

## ActionItem shape

```ts
interface ActionItem {
  id: EquipmentRowAction;
  label: string;
  show: boolean;
  disabled?: boolean;
  infoBubble?: string; // rendered via <InfoPopover content={...} /> when disabled
  tone?: 'danger';
}
```

The legacy `title?: string` field is gone — disabled-row reasoning is communicated through `infoBubble` only (visible on both desktop and mobile via the popover).
