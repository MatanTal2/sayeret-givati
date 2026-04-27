# db/server/equipmentDraftService.ts

**File:** `src/lib/db/server/equipmentDraftService.ts`
**Status:** Active (Phase 4)

## Purpose

Admin-SDK writes for `equipmentDrafts`.

## Exports

| Export | Purpose |
|--------|---------|
| `serverCreateEquipmentDraft` | Creates draft, defaults status to `awaiting_template`. |
| `serverUpdateEquipmentDraft` | Updates any of the mutable fields. |
| `serverDeleteEquipmentDraft` | Hard delete. |
| `serverPromoteDraftsForTemplate` | Called by template-approve path. Flips all drafts linked to a templateRequestId to `ready_to_submit` and returns the owning userIds so callers can notify them. |

## Firebase Operations

- `equipmentDrafts` — `set`, `update`, `delete`, batched update.
