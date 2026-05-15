# EquipmentTabs

**File:** `src/components/equipment/EquipmentTabs.tsx`

Three-tab selector for the `/equipment` page: **Self / Team / All**.

## Behavior

- Always renders `Self` and `Team`. The `All` tab is gated by `isManagerOrAbove(user)` from `equipmentPolicy`.
- Optional `counts` prop renders a small badge per tab (the page does not pass it today; field is wired for future per-scope counts without a re-fetch).

## Why three tabs and not a filter

Scope is a primary axis of the page (it changes both the data set the user expects and which actions make sense), so it sits on a tab strip rather than a dropdown. Status / search filters live separately so users can drill into a scope, not switch context.

## Visual unit

Container is a self-contained rounded card (`border border-neutral-200 bg-white rounded-xl`). It used to be `rounded-t-xl` (top-rounded only) so that `FilterBar` directly underneath could close the bottom with `rounded-b-xl`. After bug #25 inserted the active/archive `ViewToggle` between the two, the glued-card visual no longer made sense — both `EquipmentTabs` and `FilterBar` are now independent cards, separated by the ViewToggle row.
