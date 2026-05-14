# LogisticsTemplatesTab.tsx

**File:** `src/components/management/tabs/LogisticsTemplatesTab.tsx`
**Status:** Active
**Tab id:** `logistics-templates` (Management → ניהול ציוד → תבניות אפסנאות)

Replaces the previous `EquipmentCreationTab` placeholder. That tab was an
empty "coming soon" page; this is the canonical place to manage the catalogue
for the new `/logistics` ("אפסנאות") page.

## Data model

Templates live in Firestore `logisticsTemplates` and define non-serialized
inventory rows:

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Catalogue display name |
| `category` | string | Freeform — unit-specific taxonomy |
| `subcategory` | string \| undefined | Optional |
| `notes` | string \| undefined | Optional |
| `isActive` | boolean | Soft delete |
| `createdBy` | string | UID |
| `createdAt`, `updatedAt` | Timestamp | Server timestamps |

Categories are intentionally **freeform strings**, not references to the
shared `categories` collection — logistics taxonomy is decoupled from
equipment taxonomy by design.

## Permission

`canManageTemplates` (ADMIN / SYSTEM_MANAGER / MANAGER). The API route
re-checks the same gate; this UI is a convenience, not the boundary.

## Behavior

- Loads via `listLogisticsTemplates()` (client SDK reads).
- Groups by `category`; categories sorted with `localeCompare('he')`.
- Create / Edit dialog: name + category required; subcategory + notes
  optional. Posts to `/api/logistics-templates` (POST or PUT) using
  `apiFetch` (bearer token attached).
- Deactivate: confirmation dialog → `DELETE /api/logistics-templates` flips
  `isActive=false`. Inactive templates stay listed with line-through + "לא
  פעיל" pill so admins can re-edit to revive.

## Open

- No bulk CSV import yet — matches the original placeholder scope.
- No "convert to active template" UI when an inactive template is shown;
  edit the template and the UI accepts whatever `isActive` patch is sent
  (the API supports it).
- Pairs with the `/logistics` inventory page (PR2) — items pick from the
  active templates here.
