# db/server/ammunitionTemplatesService.ts

**File:** `src/lib/db/server/ammunitionTemplatesService.ts`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Admin-SDK CRUD for `ammunitionTemplates`. Plus a one-shot canonical seeder.

## Exports

| Export | Purpose |
|--------|---------|
| `validateAmmunitionTemplateInput` | Pure validator — checks name length, enum membership for subcategory/allocation/trackingMode/securityLevel/status, and BRUCE constants when `trackingMode === 'BRUCE'`. |
| `serverCreateAmmunitionTemplate` | `set` a new doc with auto id. Computes `totalBulletsPerBruce` for BRUCE templates. |
| `serverUpdateAmmunitionTemplate` | Partial update; recomputes `totalBulletsPerBruce` when both BRUCE constants are present. |
| `serverDeleteAmmunitionTemplate` | Delete by id. |
| `serverListAmmunitionTemplates` | Get all docs (no filtering — small collection). |
| `serverSeedCanonicalAmmunitionTemplates` | Idempotent on `name`. Reads existing CANONICAL templates, skips already-present names, batch-creates the rest. |

## Firebase Operations

- `ammunitionTemplates` — `add`, `set`, `update`, `delete`, `get` (collection scan).

## Notes

- The route is the gate; this service trusts its caller. Permission tiers live
  in `src/app/api/ammunition-templates/route.ts` and `[id]/route.ts`.
- Only admin/system_manager/manager may create CANONICAL templates. TL may
  propose (status `PROPOSED`); user proposals come through Phase 5's request
  flow as `PENDING_REQUEST`.
