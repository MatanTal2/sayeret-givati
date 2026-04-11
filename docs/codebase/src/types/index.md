# types/index.ts

**File:** `src/types/index.ts`  
**Lines:** 40  
**Status:** Active

## Purpose

Core soldier and form types used by the status page.

## Exports

- `Soldier` — soldier data with name, personalNumber, phone, status, platoon
- `FormErrors` — validation error map
- `NewSoldierForm` — add-soldier form shape
- `ReportSettings` — report generation options
- `FilterState` — filter state for soldier list

## Known Issues

- `Soldier` interface is duplicated in `src/app/types.ts` — see `docs/duplications.md`.
