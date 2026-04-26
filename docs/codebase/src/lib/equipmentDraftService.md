# equipmentDraftService.ts

**File:** `src/lib/equipmentDraftService.ts`
**Status:** Active (Phase 4)

## Purpose

Parks a user's half-finished sign-up when they submit a "not in list" template request. Stores already-captured S/N + photo. When the template is approved, the draft flips to `ready_to_submit` and the owning user is notified so they can resume the AddWizard.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createEquipmentDraft` | `({ userId, templateRequestId?, ... }) => Promise<string>` | |
| `updateEquipmentDraft` | `({ draftId, updates }) => Promise<void>` | |
| `deleteEquipmentDraft` | `(draftId) => Promise<void>` | |
| `getDraftsForUser` | `(userId) => Promise<EquipmentDraft[]>` | User's drafts, newest first |
| `getDraft` | `(draftId) => Promise<EquipmentDraft \| null>` | |

## Firebase Operations

Writes via `/api/equipment-drafts` (POST/PUT/DELETE). Reads via client SDK on `equipmentDrafts`.

## Notes

- `serverPromoteDraftsForTemplate(templateRequestId)` is called from the template-approval path to flip drafts to `ready_to_submit`.
- Statuses: `awaiting_template`, `ready_to_submit`, `abandoned`.
