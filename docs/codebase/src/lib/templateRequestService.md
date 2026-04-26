# templateRequestService.ts

**File:** `src/lib/templateRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Client facade for non-canonical template lifecycle: propose (TL) / request (regular user) / approve / reject. Canonical direct-create stays in `equipmentService.EquipmentTypesService.createEquipmentType`.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `proposeTemplate` | `({ actor, ...fields, draftPayload? }) => Promise<{ templateId, draftId? }>` | User → `pending_request`; TL → `proposed`. Optional draftPayload creates an equipmentDraft linked to the template. |
| `approveTemplateRequest` | `({ actor, templateId, approverUserName, edits? }) => Promise<void>` | Manager can edit then approve; promotes linked drafts. |
| `rejectTemplateRequest` | `({ actor, templateId, rejectorUserName, reason? }) => Promise<void>` | Sets status=`rejected` + optional reason. |
| `getTemplatesByStatus` | `(status) => Promise<EquipmentType[]>` | |
| `getMyPendingTemplateRequests` | `(userId) => Promise<EquipmentType[]>` | User's in-flight proposals. |

## Firebase Operations

Writes via `/api/equipment-templates/{propose,approve,reject}`. Reads via client SDK on `equipmentTemplates`.

## Notes

- Server side promotes `equipmentDrafts.templateRequestId == templateId` on approval + notifies owners so they can resume the AddWizard.
- Manager notification blast on every proposal/request (`template_proposed_for_review`, `new_template_request_for_review`).
