# lib/ammunition/inventoryService.ts

**File:** `src/lib/ammunition/inventoryService.ts`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Client-side reads for the two ammunition holding collections.

## Exports

| Export | Purpose |
|--------|---------|
| `listAmmunitionStock()` | Unfiltered list of BRUCE/LOOSE_COUNT stock entries. |
| `listSerialAmmunitionItems()` | Unfiltered list of SERIAL items. |

Mutations go through `/api/ammunition-inventory`. Visibility filtering happens
in the consumer (e.g. `useAmmunitionInventory` hook + the host page).

## Notes

- Phase 8 will tighten Firestore rules so the unfiltered scan is rejected for
  USER actors. Until then, the API gate is the source of truth and the client
  filters by holder in the UI layer.
