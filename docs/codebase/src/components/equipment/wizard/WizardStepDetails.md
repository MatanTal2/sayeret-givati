# WizardStepDetails

**File:** `src/components/equipment/wizard/WizardStepDetails.tsx`

Step 3: per-item details.

Each item has its own editor row with:

- S/N (rendered only when `template.requiresSerialNumber`).
- Catalog number (defaults to `template.defaultCatalogNumber` when populated).
- **Photo** — `CameraCapture` mounted with `autoStart={false}`. Initial state: a single dashed-outline button ("פתח מצלמה") with a sub-line hint about the browser permission prompt; no `<video>` element is mounted yet, so there is no black square. Click → `getUserMedia` permission prompt → live feed + capture button. After capture: preview with retake / use-photo. Required only when `template.requiresSerialNumber`; for non-serialized templates the label reads "(אופציונלי)" and the user can advance without capturing. The capture writes a `Blob` to in-memory state; upload is deferred to the orchestrator's submit step so abort/retake doesn't waste Storage writes. See `docs/bugs.md` #18.
- Location, notes — free text.

In bulk mode, an "add another item" button appends a fresh row; the per-row trash button removes one (disabled when only one row remains).

When resuming from a draft, the row may arrive with `photoUrl` already set. In that case the preview is rendered without retake controls — re-uploading would defeat the resume.
