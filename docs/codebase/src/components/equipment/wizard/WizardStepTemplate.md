# WizardStepTemplate

**File:** `src/components/equipment/wizard/WizardStepTemplate.tsx`

Step 2: category → (optional) subcategory → canonical template.

## Filtering

Loads `CategoriesService.getCategories({ activeOnly, includeSubcategories })` and `EquipmentService.Types.getEquipmentTypes({ activeOnly })`. The template list is then **client-filtered to `status === CANONICAL`** — regular users are not allowed to pick `proposed` or `pending_request` templates (those flow through manager review).

## "Didn't find?" link

Renders a "request a new template" link that emits `onRequestNew` to the orchestrator. The orchestrator swaps the wizard body to `RequestNewTemplateFlow`.
