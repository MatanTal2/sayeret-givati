# AddEquipmentWizard

**File:** `src/components/equipment/AddEquipmentWizard.tsx`

Multi-step wizard for soldiers to sign up new equipment. Replaces the legacy `EquipmentModal` (create mode) and `AddEquipmentModal`.

## Steps

1. **Mode** — single item vs. bulk add.
2. **Template** — category → subcategory → canonical-only template (Phase 5 status filter).
3. **Details** — per-item S/N (when `requiresSerialNumber`), catalog number, photo (mandatory), location, notes. In bulk mode each item must have its own S/N + photo (no shared photos).
4. **Review** — summary before submit.

## "Didn't find your item?" branch

A link on the template-picker step swaps the body to `RequestNewTemplateFlow` (Phase 5). Submitting a request creates a `pending_request` template plus an `EquipmentDraft` containing whatever the user has already captured. The wizard surfaces a success banner; the user is notified when the manager approves.

## Resume-from-notification

The wizard accepts two URL-driven props from the page:

- `resumeDraftId` — direct draft pointer (used if the notification carries `relatedDraftId`).
- `resumeTemplateId` — the approved template's ID (used by `template_request_approved` notifications, which carry the template ID, not the draft ID).

When either is provided, the wizard:

1. Looks up the user's draft for that template (or the supplied draft directly).
2. Loads the now-canonical template.
3. Skips straight to step 3 (`details`) with `serialNumber`, `photoUrl`, `catalogNumber`, and `notes` pre-filled.
4. Deletes the draft on successful submit so the loop closes.

## Submit path

All items go through `EquipmentService.Items.createEquipmentBatch` so the multi-item write is one transaction (one `batchId`, N action logs, N tracking entries). For non-serialized templates the wizard generates a UUID id since the template doesn't supply one.

## Why steps live in `wizard/`

Each step needs its own state validation, helpers, and JSX. Splitting them keeps the orchestrator under the 300-line cap and lets a single step be replaced (e.g., a future barcode-scan step) without touching the others.
