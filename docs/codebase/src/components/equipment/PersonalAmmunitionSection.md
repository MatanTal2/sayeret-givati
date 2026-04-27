# PersonalAmmunitionSection

**File:** `src/components/equipment/PersonalAmmunitionSection.tsx`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Cross-link from the equipment page to the ammunition feature. Renders the
"תחמושת אישית" block under the bulk-action bar — a read-only view of the
current user's USER- or BOTH-allocated holdings, plus a deep link to
`/ammunition` for the full experience.

## Behavior

- Reads templates + inventory via the shared hooks.
- Filters to `holderType === 'USER' && holderId === user.uid`.
- Further filters to templates whose `allocation` is `USER` or `BOTH`.
- Hidden entirely when both the stock and item subsets are empty.

## Notes

- This is read-only by design — additions/edits live on `/ammunition`. The
  goal is to surface ammo in the same place the soldier already sees their
  equipment without duplicating CRUD UX.
