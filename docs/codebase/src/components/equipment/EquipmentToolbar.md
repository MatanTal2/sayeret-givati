# EquipmentToolbar

**File:** `src/components/equipment/EquipmentToolbar.tsx`

Single-row header for `/equipment`. Pairs the active/archive view Switch with the "Add Item" button to avoid the wasteful two-row layout the page had before.

## Visual layout (RTL)

```
                          [ Switch | "ציוד פעיל" ] [ + הוסף ציוד ]
                              ^ to the button's left,    ^ visual right
                                clustered (no spacer)      (flex-start under RTL)
```

Implemented as a single `flex flex-wrap items-center gap-3 gap-y-2 mt-8 mb-4` row. DOM order is **Add-button first, toggle-group second** — under `dir="rtl"`, flex-start packs items from the visual right, so the button lands on the right and the toggle clusters immediately to its left. **No spacer, no `justify-between`, no auto-margin** — an earlier revision used `<div className="flex-1" />` between the two groups, which pushed the button to the visual left (end under RTL) and read as two unrelated controls; removing it restores the intended "Add Item + view-toggle as one cluster" pattern. `mt-8` gives the bar breathing room under `EquipmentTabs` (the previous `mt-4` collapsed the bar against the tabs underline). `flex-wrap` still lets the toggle drop to a new line on viewports narrower than ~360 px without horizontal overflow.

## Toggle

Headless UI `<Switch>`, role=switch, aria-label from `TEXT_CONSTANTS.FEATURES.EQUIPMENT.ARCHIVE.TOGGLE_ARIA`. The visible label string flips between `SHOW_ACTIVE` ↔ `SHOW_ARCHIVE` based on the `view` prop — there is no second label hidden somewhere; the toggle is its own state announcement.

Switch semantics: `checked === (view === 'active')`. ON (colored `bg-primary-600`) means **active items shown**; OFF (`bg-neutral-300`) means **archive shown**. This matches the user mental model — the colored/lit state is the everyday operating view, archive is the explicit opt-out. The thumb uses **logical** `start-1` / `start-6` positioning (absolute, not `translate-x-*`) so it flips correctly under the global `dir="rtl"`. This mirrors the pattern in `SystemConfigTab` and `NotificationToggleRow`; `translate-x-*` is a physical transform and breaks in RTL when the parent uses logical layout.

## Archive count badge

Surfaces next to the toggle **only while viewing the archive** and only when `archiveCount > 0`. Shown on the active view too, the number doubled as visual noise on the everyday screen and was being read as a count of active items. Restricting it to the archive view turns it into a contextual "how many items are here" indicator.

## Add Item

Same primary-button styling as the rest of the app (`bg-primary-600`, `Plus` icon, `ADD_NEW` label). Hidden when `canAdd=false` so policy gating is a one-prop concern at the call site, not a duplicate condition inside this component.

## Props

| Prop | Type | Purpose |
|---|---|---|
| `view` | `'active' \| 'archive'` | Current view; drives Switch state + label |
| `onViewChange` | `(next) => void` | Called with the next view on toggle |
| `archiveCount` | `number` | Drives badge visibility |
| `onAddClick` | `() => void` | Fired when the Add Item button is clicked |
| `canAdd` | `boolean` | When `false`, hides the Add Item button |

## What this component does NOT do

- Filtering / sorting — that lives in `FilterBar` and `EquipmentTable`.
- Selection-clearing on view change — the page's `onViewChange` handler clears the bucket-scoped selection set so bulk actions can't target invisible rows.
- Policy — `canAdd` is computed by the parent; the toolbar just renders or omits the button.
