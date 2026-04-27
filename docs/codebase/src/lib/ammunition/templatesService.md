# lib/ammunition/templatesService.ts

**File:** `src/lib/ammunition/templatesService.ts`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Client-side reads for `ammunitionTemplates`. Mirrors the `EquipmentTypesService`
read split — writes go to the API, reads use the client SDK.

## Exports

| Export | Purpose |
|--------|---------|
| `listAmmunitionTemplates()` | Unfiltered list of all templates. Used by `useAmmunitionTemplates` and the management Templates section. |

## Notes

- For Phase 2 the management section uses the API GET (which already does the
  same read, server-side) — `useAmmunitionTemplates.refresh` calls the API.
  This client function is provided for future read sites that need direct
  Firestore access (e.g., the user-facing `/ammunition` page in Phase 3).
