# Ammunition Training Components

Aggregate doc for the four components that make up the
`/ammunition/training` Phase 1 UI. Spec: `docs/spec/ammunition-training.md`.

## PlanTrainingModal

**File:** `src/components/ammunition/PlanTrainingModal.tsx`

Modal that builds a `CreateTrainingPlanInput` and submits it via
`useTrainingPlans.create`.

Fields:
- `<input type="datetime-local">` start / end (default: tomorrow 09:00 / +3h)
- Team `Select` from `systemConfig.teams` (B1 picker pattern from
  `AddInventoryModal`). Locked for non-(admin/system_manager).
- Range location, contact name, contact phone, radio frequency text inputs.
- Headcount number input (min 1).
- Dynamic ammo lines, each row = subcategory `Select` + template `Select`
  filtered by subcategory + qty input + remove button (B4 picker pattern).
- Notes textarea (optional).

Client validation: end > start, all required fields present, headcount ≥
1, every line has a template + qty > 0.

## PlannedTrainingsTable

**File:** `src/components/ammunition/PlannedTrainingsTable.tsx`

Table view (rows, not cards). Splits plans into two groups:
- **Active**: `status ∈ {PENDING_APPROVAL, APPROVED}`
- **Archive**: collapsed `Disclosure` for everything else.

Per-row actions are gated by role:
- `canApproveOrReject` = admin / system_manager / ammo-responsible user.
  Shows Approve / Reject for `PENDING_APPROVAL`.
- Planner OR `canApproveOrReject` may Cancel
  (`PENDING_APPROVAL`/`APPROVED`) or Complete (`APPROVED` only).
- Reject prompts via `window.prompt` for a reason (Phase 1 simplicity).
  Cancel uses `window.confirm`.

## AmmunitionBellyView

**File:** `src/components/ammunition/AmmunitionBellyView.tsx`

Computes per-template totals from `useAmmunitionInventory` and subtracts
the sum of `ammoLines.qty` over plans with status ∈ `{PENDING_APPROVAL,
APPROVED}`. Renders rows; danger-highlighted when `available < 0` plus a
"בקש תוספת" button that opens `RestockRequestModal`.

Total formula by tracking mode:
- BRUCE: `Σ stock.bruceCount × cardboardsPerBruce × bulletsPerCardboard`
- LOOSE_COUNT: `Σ stock.quantity`
- SERIAL: count of items with `status === 'AVAILABLE'`

Open BRUCE state is intentionally ignored in Phase 1.

## RestockRequestModal

**File:** `src/components/ammunition/RestockRequestModal.tsx`

Pre-filled with the shortfall qty for the selected template. The user
chooses which active plan the request is tied to (filtered to plans that
contain the template). Optional note. Submits via
`useTrainingPlans.requestRestock(planId, payload)` → server creates an
`AMMO_RESTOCK_REQUEST` notification addressed to
`systemConfig.ammoNotificationRecipientUserId`.

## Reused patterns

- Modal scaffolding (close + error + submitting state): from
  `AddInventoryModal`.
- Team `Select` from `systemConfig.teams`: B1 pattern shipped in
  `fix/ammunition-page-defects`.
- Subcategory → template picker: B4 pattern from same branch.
- `<input type="datetime-local">` + `nowLocalInput()`: from
  `ReportUsageForm`.
