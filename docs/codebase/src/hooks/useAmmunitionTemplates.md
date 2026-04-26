# useAmmunitionTemplates

**File:** `src/hooks/useAmmunitionTemplates.ts`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Client hook for the ammunition templates collection. Wraps `/api/ammunition-templates`
with `{ templates, isLoading, error, create, update, remove, seedCanonical, refresh }`.

## Behavior

- On mount: `GET /api/ammunition-templates` → populates `templates`.
- `create`/`update`/`remove`/`seedCanonical`: build an `ApiActor` from
  `useAuth().enhancedUser`, post to the API, refresh the list on success.
- Errors set `error`. Each mutator returns a boolean (`null` for `seedCanonical`
  on auth failure) so the caller can show a toast.

## API surface

| Hook method | API call |
|-------------|----------|
| `refresh` | `GET /api/ammunition-templates` |
| `create(payload)` | `POST /api/ammunition-templates` with `{ actor, payload }` |
| `update(id, payload)` | `PUT /api/ammunition-templates/[id]` with `{ actor, payload }` |
| `remove(id)` | `DELETE /api/ammunition-templates/[id]` with `{ actor }` |
| `seedCanonical()` | `POST /api/ammunition-templates` with `{ actor, action: 'seed_canonical' }` |

## Consumers

- `AmmunitionTemplatesSection` (management page).
- Phase 3 will reuse it from the user-facing `/ammunition` template picker.
