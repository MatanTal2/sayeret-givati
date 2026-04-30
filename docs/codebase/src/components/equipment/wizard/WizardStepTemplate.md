# WizardStepTemplate

**File:** `src/components/equipment/wizard/WizardStepTemplate.tsx`

Step 2: category → (optional) subcategory → canonical template.

## Filtering & layout

Loads `CategoriesService.getCategories({ activeOnly, includeSubcategories })` and `EquipmentService.Types.getEquipmentTypes({ activeOnly })`. Templates are **client-filtered to `status === CANONICAL`** — regular users are not allowed to pick `proposed` or `pending_request` templates (those flow through manager review).

### Pickers

- **Category** — `Select` (Headless UI `Listbox`), clearable, no virtual default. Picking a new category resets `subcategoryId` to `null`.
- **Subcategory** — `Select` with an explicit "הכל" / `WIZARD.ALL_SUBCATEGORIES` option prepended (sentinel `__all__`). Picking it sets `subcategoryId` to `null`. The sentinel is converted at the boundary so callers only ever see real ids or `null`. Rendered only when the chosen category has at least one subcategory.

Filter rules: keep template if `category === categoryId` and (`subcategoryId === null` or `subcategory === subcategoryId`). Templates with empty `subcategory` are reachable via the "הכל" option.

### Template rows

Each template renders as a Headless UI `Disclosure`. A single click on the `DisclosureButton` does **two things at once**:
1. Toggles the panel open/closed.
2. Calls `onPick({ categoryId, subcategoryId, template })`, which the orchestrator uses to select the template and let the user advance.

The active template row stays styled (`border-primary-500 bg-primary-50`) regardless of open state, so the user can see which one is selected after collapsing the panel.

Compact header layout (left-to-right in the flex row, inline-start to inline-end under RTL):
- Template name.
- `[צ]` badge if `requiresSerialNumber`.
- `[דיווח]` badge if `requiresDailyStatusCheck`.
- Chevron pinned end-side via `ms-auto` (rotates on open).
- Description on a second line if present.

### Scroll behavior

The templates `<ul>` is capped at `max-h-72` (~288px ≈ 4 collapsed rows) with `overflow-y-auto` and `pe-1` so the inline-end scrollbar does not overlap an active row's border. The category + subcategory `Select` pickers stay pinned above the cap, so they remain reachable while the user scrolls long result sets. Pattern matches the `max-h-* overflow-y-auto` cap used in `TransferModal.tsx` and `ReportUsageForm.tsx`.

Expanded panel surfaces the rest of the template fields:
- `notes` (if present).
- `defaultCatalogNumber` (if present, labeled "מק״ט ברירת מחדל").
- Falls back to `WIZARD.TEMPLATE_NO_EXTRA_INFO` when both are empty so the panel is never blank.

## "Didn't find?" link

Renders a "request a new template" link that emits `onRequestNew` to the orchestrator. The orchestrator swaps the wizard body to `RequestNewTemplateFlow`.

## Styling

Category + subcategory pickers use the shared `Select` component (`src/components/ui/Select.tsx`) — a Headless UI `Listbox` wrapper. Native `<select>` was removed because OS-rendered option panels overflow the modal and ignore site CSS. Both selects are `clearable` so the user can deselect back to no choice. See `docs/codebase/src/components/ui/Select.md`.
