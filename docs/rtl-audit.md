# RTL Audit — findings & triage

**Status:** In progress. Batches landing one at a time on dedicated branches.
Full sweep is multi-session; this doc tracks the punch list.

**Hit-count note:** the initial 505-hit count came from a loose grep
(`pl-|pr-|...` without word boundary, which matched substrings like `pr-imary-`).
The stricter grep `(\s|"|')(pl-|pr-|ml-|mr-)\d` returns **49 real hits across 21
files** — much more tractable. Use the stricter form when re-running.

`<html dir="rtl">` is set globally in `src/app/layout.tsx`. CLAUDE.md forbids
per-component `dir="rtl"`. Despite that, components leak LTR through hardcoded
physical Tailwind classes (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`,
`justify-end`, `left-*`, `right-*`, etc.) and stray `dir="ltr"`.

## Conventions (canonical fixes)

| Physical (LTR-only)               | Logical (RTL-correct)             | Notes |
|----------------------------------|-----------------------------------|-------|
| `pl-*` / `pr-*`                  | `ps-*` / `pe-*`                    | start / end padding |
| `ml-*` / `mr-*`                  | `ms-*` / `me-*`                    | start / end margin |
| `text-left` / `text-right`       | `text-start` / `text-end`          | logical text alignment |
| `border-l*` / `border-r*`        | `border-s*` / `border-e*`          | logical borders |
| `rounded-l-*` / `rounded-r-*`    | `rounded-s-*` / `rounded-e-*`      | logical corner rounding |
| `left-*` / `right-*` (absolute)  | `start-*` / `end-*`                | logical positioning |
| `justify-end`                    | depends on intent — see below      | see "justify-end" gotcha |

### `justify-end` gotcha

`justify-end` is itself logical: in RTL it pushes content to the visual **left**
(reading-direction end). The bug surfaces when a Hebrew layout expects a button
on the **right** (start of reading). Use `justify-start` in that case.

Recurring offender: action-row headers that want the primary CTA on the right.

## Status

### ✅ Fixed (2026-05-12, batch 1)

- `src/app/ammunition/training/page.tsx:56` — `justify-end` → `justify-start`
  on the "תכנן אימון" action row (was pushing the Plus button to the left).

### ✅ Fixed (2026-05-12, batch 2 — `fix/rtl-batch-2-and-no-browser-dialogs`)

- `src/components/equipment/TransferModal.tsx` — 6 hits. Search-input icon
  positioning converted from `left-0 pl-3` / `right-0 pr-3` to `start-0 ps-3` /
  `end-0 pe-3`. Textarea icon at `top-3 left-3` → `top-3 start-3`. Input padding
  flipped to logical (`ps-10 pe-3`). Required-asterisk margins to `ms-1`.
  Stray `text-red-*` / `border-red-*` swapped for `text-danger-*` /
  `border-danger-*` tokens while at it.
- `src/components/management/tabs/UsersTab.tsx` — 9 hits. All `ml-*` on
  icons → `me-*` (gap toward following text). All `mr-4` on stats-card text
  blocks → `ms-4` (gap toward preceding icon).
- `src/app/status/page.tsx` — 3 hits. Search-input padding `pl-10` → `ps-10`;
  absolute-positioned search icon `left-0 pl-3` → `start-0 ps-3`; counter
  span margin `mr-2` → `ms-2`.
- `src/app/components/SoldiersTableMobile.tsx` — 2 hits. Name span padding
  `pr-0.5` → `pe-0.5`; platoon span margin `ml-3` → `me-3`.

### ✅ Fixed (2026-05-12, batch 3 — `fix/rtl-batch-3-shared-modals`)

- `src/components/ui/ConfirmationModal.tsx` — 2 hits + 1 forbidden per-component
  `dir`. Removed `dir={useHomePageStyle ? "rtl" : "ltr"}` (CLAUDE.md forbids
  per-component `dir`; modal inherits from `<html dir="rtl">`). `ml-3` → `ms-3`,
  spinner `mr-2` → `me-2`.
- `src/components/auth/LoginModal.tsx` — 4 real hits (the audit had only listed
  1; found more on inspection). Close button `right-4` → `end-4`; email + password
  inputs `text-right` → `text-end`, `pr-12` → `pe-12`; absolute-positioned
  email icon `left-3` → `end-3`; password eye-toggle `left-3` → `end-3`.
- `src/app/components/SearchBar.tsx` — 2 hits. Input padding `pl-10` → `ps-10`;
  absolute icon `left-0 pl-3` → `start-0 ps-3`.
- `src/components/registration/AccountDetailsStep.tsx` — 12 hits (audit had
  listed 3; tooltip + spinner pile-on). All `text-right` → `text-end`. Email
  field `pr-12` + `right-3` → `ps-12` + `start-3`. Password field
  `pl-12 pr-12` → `pe-12 ps-12`; eye-toggle button `left-3` → `end-3`; lock
  icon `right-3` → `start-3`. Tooltip absolute `right-0` → `start-0`, arrow
  `right-3` → `start-3`, `border-l-4 border-r-4 border-l-transparent
  border-r-transparent` → `border-s-4 border-e-4 border-s-transparent
  border-e-transparent`. Spinner `-ml-1 mr-2` → `-ms-1 me-2`. Stale "Now on
  Left/Right" comments removed.
- `src/components/ui/FormField.tsx` — 1 hit. Required-asterisk `mr-1` → `ms-1`.
- `src/app/components/TextInputWithError.tsx` — 1 hit. Label `pr-1.5` → `pe-1.5`.

### ✅ Fixed (2026-05-13, batch 4 — `fix/rtl-batch-4-registration-and-admin-tabs`)

`RegistrationDetailsStep.tsx` + 8 admin/form components. Audit's strict grep
(margin-only) listed 11 hits; widened to also catch `text-right`, `border-r-*`,
`absolute left-*/right-*`, etc. that the strict grep missed. Real fixed count:
~25 hits across these files.

- `src/components/registration/RegistrationDetailsStep.tsx` — 12 hits. Read-only
  first/last-name inputs `text-right` → `text-end`; email + password inputs
  `text-right` → `text-end`; password `pr-12` → `pe-12`; absolute email icon +
  password eye-toggle `left-3` → `end-3`; six error-message `text-right` →
  `text-end`; birthdate input `text-right` → `text-end`.
- `src/components/management/tabs/DataManagementTab.tsx` — 7 hits. Five
  table-header `text-right` → `text-start`; two action-button `ml-2` → `me-2`.
- `src/components/management/tabs/EmailTab.tsx` — 3 hits. Two checkbox
  `ml-2` → `me-2`; one template-card `text-right` → `text-end`.
- `src/components/management/tabs/PermissionsTab.tsx` — 2 hits. Both checkbox
  `ml-2` → `me-2`.
- `src/components/management/sidebar/SidebarNavigation.tsx` — 3 hits. Active-tab
  indicator `border-r-2` → `border-e-2`; icon-text gap `ml-3` → `me-3`; label
  `text-right` → `text-start`.
- `src/components/management/tabs/AuditLogsTab.tsx` — 7 hits. Six table-header
  `text-right` → `text-start`; stats-card text block `mr-4` → `ms-4`.
- `src/components/management/tabs/CustomUserSelectionModal.tsx` — 3 hits.
  Horizontal scroller `pl-4 pr-4` → `ps-4 pe-4`; two absolute fade-edges
  `left-0` / `right-0` → `end-0` / `start-0` (gradient direction unchanged —
  site is pure RTL, so visual placement is preserved).
- `src/components/management/tabs/EnforceTransferTab.tsx` — 7 hits. Six
  table-header `text-right` → `text-start`; approve-button `ml-2` → `me-2`.
- `src/components/equipment/template-form/FormFieldRequiresDailyCheck.tsx` — 1
  hit. Label `mr-2` → `ms-2`.

### 🟡 Quick-win candidates (next batch)

Remaining hits surfaced during batch 4 that are out of its scope. Audit's
margin-only strict grep undercounted these; logical conversion is still
incomplete in many admin/registration components.

| File | Notes |
|------|-------|
| `src/components/management/tabs/UsersTab.tsx` | 6 table-header `text-right` (batch 2 fixed margins only). Convert to `text-start`. |
| `src/components/management/tabs/TemplatesTab.tsx` | `text-right` on disclosure button. |
| `src/components/management/tabs/PermissionGrantsTab.tsx` | `left-1/2` on toast. |
| `src/components/management/BulkTemplateImportModal.tsx` | `text-right` table. |
| `src/components/registration/PersonalDetailsStep.tsx` | 6 `text-right` + 1 `text-left` (date input — exempt; verify). |
| `src/components/registration/OTPVerificationStep.tsx` | `left-3` icon. |
| `src/components/registration/RegistrationForm.tsx` | `text-right` + `left-3` icon. |
| `src/components/registration/RegistrationStepDots.tsx` | `left-1/2` tooltip + `border-l-2 border-r-2 …` triangle. |
| `src/components/ammunition/AmmunitionInventoryView.tsx` + 4 other `Ammunition*` views | `text-right` tables. |
| `src/components/equipment/TransferModal.tsx` | 2 `text-right` (search results — batch 2 fixed icons). |
| `src/components/notifications/NotificationItem.tsx` | `border-r-2` + `left-2` dot. |
| `src/components/notifications/NotificationBell.tsx` | 2 `-right-1` absolute badges. |
| `src/components/equipment/EquipmentErrorBoundary.tsx` | `text-left` (English stack trace — likely exempt). |
| `src/components/EquipmentTest.tsx` + `SimpleUserTest.tsx` | Dev-only — skip. |

`justify-end` on button rows is intentional everywhere it appears (CTAs end-aligned
in modal footers). Do not flag those.

Pattern for password / email input pairs (codify):
- Hebrew text-input: `text-end` (not `text-right`)
- Reserve space for trailing icon: `pe-12` (not `pr-12`) when icon at `end-3`
- Reserve space for leading icon: `ps-12` (not `pl-12`) when icon at `start-3`
- Absolute icon positioning: `start-3` / `end-3` (not `left-3` / `right-3`)
- Borders: `border-s-*` / `border-e-*` (not `border-l-*` / `border-r-*`)

### 🔴 Intentional `dir="ltr"` (DO NOT REMOVE)

- `src/components/registration/PersonalDetailsStep.tsx:178` — `<input type="date">`
  inside RTL form. Segment order breaks without it. Documented inline at
  `PersonalDetailsStep.tsx:145`.

## Process

1. Pick one file from the quick-win list.
2. Grep for `\bpl-|\bpr-|\bml-|\bmr-|text-left|text-right|justify-end|border-l|border-r|rounded-l|rounded-r|left-\d|right-\d` inside that file.
3. For each hit, decide: convert to logical, or keep (with a one-line comment explaining why).
4. QA the page on mobile against the production design.
5. Commit per-file; add to the "Fixed" list with a one-line rationale.

## Related follow-up (not RTL but found during audit)

- ~~`src/components/ammunition/PlannedTrainingsTable.tsx:175,178` — uses
  `window.prompt` and `window.alert`.~~ **DONE 2026-05-12 on
  `fix/rtl-batch-2-and-no-browser-dialogs`.** Replaced with an inline
  Headless UI `Dialog` containing a textarea for the rejection reason +
  inline error rendering for the empty-reason case. New text constants:
  `REJECT_TITLE`, `REJECT_SUBMIT`, `REJECT_CANCEL`, `REJECT_REASON_PLACEHOLDER`
  under `FEATURES.AMMUNITION.TRAINING`.
