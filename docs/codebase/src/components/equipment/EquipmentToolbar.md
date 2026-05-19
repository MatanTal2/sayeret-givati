# EquipmentToolbar

**File:** `src/components/equipment/EquipmentToolbar.tsx`

Single-row header for `/equipment`. Pairs the active/archive view Switch with the "Add Item" button to avoid the wasteful two-row layout the page had before.

## Visual layout (RTL)

```
[ Switch | "ציוד פעיל" | (count) ]            [ + הוסף ציוד ]
              ^ visual right                       ^ visual left
```

Implemented as a single `flex flex-wrap items-center gap-3 gap-y-2` row with a `<div className="flex-1" />` spacer between the toggle group and the button. `flex-wrap` lets the Add Item button drop to a new line on viewports narrower than ~360 px without horizontal overflow.

## Toggle

Headless UI `<Switch>`, role=switch, aria-label from `TEXT_CONSTANTS.FEATURES.EQUIPMENT.ARCHIVE.TOGGLE_ARIA`. The visible label string flips between `SHOW_ACTIVE` ↔ `SHOW_ARCHIVE` based on the `view` prop — there is no second label hidden somewhere; the toggle is its own state announcement.

The thumb uses **logical** `start-1` / `start-6` positioning (absolute, not `translate-x-*`) so it flips correctly under the global `dir="rtl"`. This mirrors the pattern in `SystemConfigTab` and `NotificationToggleRow`; `translate-x-*` is a physical transform and breaks in RTL when the parent uses logical layout.

## Archive count badge

Always visible next to the toggle when `archiveCount > 0`, regardless of which view is active. Acts as a passive nudge — "there's stuff in archive" — without making the user flip the toggle to find out.

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
