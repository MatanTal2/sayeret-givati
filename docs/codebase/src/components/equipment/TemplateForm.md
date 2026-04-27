# `src/components/equipment/TemplateForm.tsx`

Shared embedded form for equipment-template authoring. One form, four callers.

## Modes

| Mode | Caller | Submission target |
|---|---|---|
| `create_canonical` | TemplatesTab "Create canonical" (manager+) | `EquipmentTypesService.createEquipmentType` (sets `status=CANONICAL`) |
| `propose` | TemplatesTab "Propose" (TL when granted access) | `proposeTemplate` (server sets `status=PROPOSED`) |
| `edit_and_approve` | TemplatesTab review row (manager+) | `approveTemplateRequest` with edits (promotes to `CANONICAL`) |
| `request` | `RequestNewTemplateFlow` (regular user) | `proposeTemplate` (server sets `status=PENDING_REQUEST`) |

The form itself is mode-agnostic — it gathers values and validates. The parent decides which service to call. Mode only adjusts the default submit-button label.

## Fields

- `name` (required)
- `description`
- `category`, `subcategory` (required, loaded from `CategoriesService.getCategories`)
- `requiresSerialNumber` (boolean, default `true`)
- `requiresDailyStatusCheck` (boolean)
- `defaultCatalogNumber`
- `notes`

Returns the values via the `onSubmit` callback. Parent owns the actual API call and `isSubmitting` flag.

## Why this exists alongside `EquipmentTemplateForm.tsx`

`EquipmentTemplateForm.tsx` is the legacy modal that the legacy `AddEquipmentModal` still consumes. Phase 5 introduced the new shared form without touching legacy components (per phase plan). Phase 6 will delete `EquipmentTemplateForm.tsx` and route every caller through `TemplateForm`.
