# TeamAmmunitionSection

**File:** `src/components/equipment/TeamAmmunitionSection.tsx`
**Status:** Active.

## Purpose

Bridges ammunition into the equipment page. When the team tab is active on
`/equipment`, this section surfaces the team's holdings — both stock
(BRUCE / LOOSE_COUNT) and serial items (צ) — using the shared
`AmmunitionInventoryView` in read-only mode.

Mutations stay on `/ammunition`; this section is informational only and
shows a link back to the ammunition page.

## Behavior

- Returns `null` when the user has no `teamId`.
- Reads `useAmmunitionTemplates` + `useAmmunitionInventory` and filters
  `holderType==='TEAM' && holderId===user.teamId`.
- Empty state still renders the section header so the user knows the
  feature exists for their team.

## Companion section

`PersonalAmmunitionSection` (in the same folder) shows the equivalent
personal holdings on the self tab. The two sections are mutually
exclusive — `/equipment/page.tsx` renders one or the other based on the
current scope.
