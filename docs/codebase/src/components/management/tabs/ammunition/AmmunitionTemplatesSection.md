# AmmunitionTemplatesSection

**File:** `src/components/management/tabs/ammunition/AmmunitionTemplatesSection.tsx`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Templates sub-section of the Ammunition tab. Lists templates grouped by status
(`canonical / proposed / pending`) and exposes admin/manager CRUD plus a
one-click canonical seeder.

## Capabilities

- **Create** — opens `AmmunitionTemplateForm` in `create` mode. Status defaults
  to `CANONICAL` (admin/manager); the route enforces actual permission.
- **Edit** — pre-fills `AmmunitionTemplateForm` with the current template; status
  is preserved unless changed.
- **Delete** — confirmation dialog; immediate.
- **Seed canonical** — POSTs `{ action: 'seed_canonical' }` to the templates
  API. Idempotent (skips by `name`).

## Permission gate

Mutator buttons (create / edit / delete / seed) are visible only when the user
is admin / system_manager / manager. The route is the source of truth — UI
hides buttons for the read-only case.

## Rendering

Three tables, sortable by Hebrew locale. `securityLevel` renders as a colored
badge (`danger` for EXPLOSIVE, `warning` for GRABBABLE) — this matches the spec
note that the badge surfaces in lists/audit.

## Open

- A future enhancement could split tables into separate components when the
  collection grows past ~50 entries (sortable columns / filtering).
