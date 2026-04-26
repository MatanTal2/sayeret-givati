# WizardStepTemplate

**File:** `src/components/equipment/wizard/WizardStepTemplate.tsx`

Step 2: category → (optional) subcategory → canonical template.

## Filtering

Loads `CategoriesService.getCategories({ activeOnly, includeSubcategories })` and `EquipmentService.Types.getEquipmentTypes({ activeOnly })`. The template list is then **client-filtered to `status === CANONICAL`** — regular users are not allowed to pick `proposed` or `pending_request` templates (those flow through manager review).

## "Didn't find?" link

Renders a "request a new template" link that emits `onRequestNew` to the orchestrator. The orchestrator swaps the wizard body to `RequestNewTemplateFlow`.

## Styling

Both selects (category + subcategory) use the shared `input-base` component class with `text-sm truncate`. This keeps them within the wizard modal's inner padding on small viewports and prevents long Hebrew option labels from blowing the field's width past the screen edge.
