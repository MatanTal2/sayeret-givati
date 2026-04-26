# EquipmentTabs

**File:** `src/components/equipment/EquipmentTabs.tsx`

Three-tab selector for the `/equipment` page: **Self / Team / All**.

## Behavior

- Always renders `Self` and `Team`. The `All` tab is gated by `isManagerOrAbove(user)` from `equipmentPolicy`.
- Optional `counts` prop renders a small badge per tab (the page does not pass it today; field is wired for future per-scope counts without a re-fetch).

## Why three tabs and not a filter

Scope is a primary axis of the page (it changes both the data set the user expects and which actions make sense), so it sits on a tab strip rather than a dropdown. Status / search filters live separately so users can drill into a scope, not switch context.
