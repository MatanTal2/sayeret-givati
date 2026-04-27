# `src/components/equipment/RequestNewTemplateFlow.tsx`

Inline sub-flow for the "didn't find your item?" path inside the `AddEquipmentWizard`. Built in Phase 5; mounted in Phase 6 once the wizard exists.

## What it does

A regular user filling the wizard cannot find a matching canonical template. They click "didn't find?" and this component opens with the S/N + photo they already captured. Pre-filled context is passed in as props. The user fills the `TemplateForm` (in `request` mode), submits, and the server:

1. Creates an `equipmentTemplates/{id}` doc with `status=PENDING_REQUEST`
2. Creates an `equipmentDrafts/{id}` doc with the captured S/N + photo, linked via `templateRequestId`
3. Notifies all managers (`new_template_request_for_review`)

After the manager approves, `serverPromoteDraftsForTemplate` flips the draft status to `ready_to_submit` and notifies the user (`template_request_approved`). Clicking that notification re-opens the wizard with the draft pre-filled (Phase 6 wiring).

## Props

| Prop | Purpose |
|---|---|
| `capturedSerialNumber` | S/N already entered in the wizard |
| `capturedPhotoUrl` | Photo URL uploaded earlier |
| `capturedCatalogNumber` | Optional מק"ט |
| `capturedNotes` | Optional notes |
| `onCancel` | Back to category step |
| `onSubmitted` | Receives `{ templateId, draftId }` |

## States

- Form (`TemplateForm` + info banner explaining the pending flow)
- Error (banner with last error message)
- Submitted (success card; user is told they will receive a notification)
