# EquipmentTable

**File:** `src/components/equipment/EquipmentTable.tsx`

Replaces the legacy `EquipmentList`. Expandable-row table with row selection, photo thumbs, sort, and the **dimmed-row** rule.

## Dimmed rule

```
equipment.signedById === user.uid && equipment.currentHolderId !== user.uid
```

→ row gets `opacity-60` plus a sub-line `"ציוד זה אצל {currentHolder}"`. The signer keeps accountability and still sees the item; the row is visually de-emphasized because it isn't physically with them.

## Staleness badge

Computed client-side from `lastReportUpdate` against a 7-day threshold. Phase 1 has no daily cron; the badge is the user-visible signal that a report is overdue.

## What this component does NOT do

- Filtering / search — that is the page's job; the table receives the already-filtered list.
- Permission gating per row — handled by `EquipmentRowActions` via `equipmentPolicy`.
- Mutation — purely a presentation + selection component. Mutations route through the modal wired on each row action.
