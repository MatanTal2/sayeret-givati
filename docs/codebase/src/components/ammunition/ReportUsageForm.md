# ReportUsageForm

**File:** `src/components/ammunition/ReportUsageForm.tsx`
**Status:** Active (Phase 4 — Ammunition feature)

## Purpose

User-facing usage report form. Hosted in a modal from `/ammunition`.

## Field set per tracking mode

- `BRUCE` — `brucesConsumed`, `cardboardsConsumed`, `bulletsConsumed`,
  `finalOpenBruceState`. The current stock count + open-bruce label is shown
  underneath the inputs as a helper hint.
- `LOOSE_COUNT` — `quantityConsumed` (positive integer). Current quantity
  shown as a helper.
- `SERIAL` — checkbox list of available items the reporter holds. At least
  one selection is required.

Always: `reason` (textarea, required) and `usedAt` (`datetime-local`,
defaults to now).

## Allowed templates

Only templates the reporter actually has stock or items for (computed from
the `myStock` / `myItems` props). If the inventory is empty, the form shows
the empty-inventory copy and disables submit.

## Notes

- Phase 6 will pass a `reportRequestId` through when the form is opened from
  a notification deep link, and pre-pick the template list. The current props
  shape has room for that without breaking changes.
- The form does not enforce that consumed ≤ stock — the server transaction
  is the source of truth and rejects overconsumption with a friendly error.
