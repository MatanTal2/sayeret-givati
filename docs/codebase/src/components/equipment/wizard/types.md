# wizard/types.ts

**File:** `src/components/equipment/wizard/types.ts`

Shared shapes for `AddEquipmentWizard` and its step components. Defines:

- `WizardStep` — `'mode' | 'template' | 'details' | 'review'`.
- `WizardMode` — `'single' | 'bulk'`.
- `WizardItemDraft` — per-item state in the wizard. Holds both an in-memory `photoBlob` (pending upload) AND a remote `photoUrl` (filled when resuming from a draft that already uploaded). Submit code prefers `photoUrl` and falls back to uploading the blob.
- `WizardState` — orchestrator-level container.
- `createEmptyItem()` — factory used to add a row in bulk mode and to seed the initial single-item state. Uses `crypto.randomUUID()` for keys with a fallback for older runtimes.
