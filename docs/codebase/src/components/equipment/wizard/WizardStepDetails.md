# WizardStepDetails

**File:** `src/components/equipment/wizard/WizardStepDetails.tsx`

Step 3: per-item details.

Each item has its own editor row with:

- S/N (rendered only when `template.requiresSerialNumber`).
- Catalog number (defaults to `template.defaultCatalogNumber` when populated).
- **Photo** — `CameraCapture` component; preview shows immediately after capture. The capture writes a `Blob` to in-memory state; upload is deferred to the orchestrator's submit step so abort/retake doesn't waste Storage writes.
- Location, notes — free text.

In bulk mode, an "add another item" button appends a fresh row; the per-row trash button removes one (disabled when only one row remains).

When resuming from a draft, the row may arrive with `photoUrl` already set. In that case the preview is rendered without retake controls — re-uploading would defeat the resume.
