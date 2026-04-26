# AmmunitionTemplateForm

**File:** `src/components/ammunition/AmmunitionTemplateForm.tsx`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Shared embedded form for creating or editing an ammunition template. Two modes:
`'create' | 'edit'`. Supplies a `status` for the parent to thread back into
the API payload.

## Fields

- `name` — Hebrew name (required, ≥ 2 chars)
- `subcategory` — fixed list from `AMMUNITION_SUBCATEGORIES`
- `allocation` — `USER | TEAM | BOTH`
- `trackingMode` — `BRUCE | SERIAL | LOOSE_COUNT`
- `securityLevel` — `EXPLOSIVE | GRABBABLE`
- `bulletsPerCardboard` + `cardboardsPerBruce` — required when `trackingMode === 'BRUCE'`; collapsed otherwise
- `description` — optional textarea

## Validation

Client-side: short name, non-positive BRUCE constants. Server-side validator
in `validateAmmunitionTemplateInput` is the source of truth — this form is the
first guard, not the only one.

## Reuse

Currently used only by `AmmunitionTemplatesSection`. Phase 5 user-template
request flow may wrap it in a request mode (mirroring `RequestNewTemplateFlow`
for equipment).
