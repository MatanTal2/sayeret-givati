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

## Category / subcategory rendering

`Equipment.category` and `Equipment.subcategory` are stored as Firestore doc IDs (mirrors `EquipmentType`). The expanded row resolves them to Hebrew names via `useCategoryLookup` and renders `cat / sub`. Unresolved IDs fall back to the raw ID with `text-warning-700` (same pattern as `TemplatesTab`), so orphan refs surface visibly instead of silently. See `docs/bugs.md` #16.

## What this component does NOT do

- Filtering / search — that is the page's job; the table receives the already-filtered list.
- Permission gating per row — handled by `EquipmentRowActions` via `equipmentPolicy`.
- Mutation — purely a presentation + selection component. Mutations route through the modal wired on each row action.
