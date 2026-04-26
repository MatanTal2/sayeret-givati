# /ammunition

**File:** `src/app/ammunition/page.tsx`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

User-facing ammunition page. Two stacked sections:

- **תחמושת אישית** — entries where the current user is the holder.
- **תחמושת צוות** — entries where the user's team is the holder. Hidden when
  the user has no `teamId`.

A single "+ הוסף" button opens the shared `AddInventoryModal`. The modal
exposes a holder picker for TL+ actors only.

## Permissions

The page renders for all authenticated users. The `canMutate` predicate
determines which trash buttons appear:

- `MANAGER+` → all rows in their visibility.
- `TEAM_LEADER` → own team rows + USER-holder rows. (Server further checks
  that the user is in the TL's team — UI is permissive here, server is
  authoritative.)
- `USER` → only their own USER-holder rows.

## Notes

- The page reads inventory via the client SDK (collection scan). Phase 8
  Firestore rules will tighten this; until then, the API gate is the
  authoritative permission boundary for mutations.
- Phase 4 will add a "report use" CTA to this page, hosting the ammunition
  report form in a modal.
