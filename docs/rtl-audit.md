# RTL Audit — findings & triage

**Status:** ✅ Sweep complete (2026-05-13, batch 5). Batches 1-5 shipped.
Remaining hits in production code: 28 `justify-end` on modal-footer CTA rows
(INTENTIONAL — they end-align primary buttons), 3 EXEMPT (`<input type="date">`
segments + English stack-trace in `EquipmentErrorBoundary`), and dev-only test
components (`EquipmentTest.tsx`, `SimpleUserTest.tsx`) which are not user-facing.
Tooltip/toast centering via `left-1/2 + -translate-x-1/2` is logical-agnostic
and stays as-is.

See "Guidelines for new code" below for conventions to keep this clean.

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

### Slide-out drawer gotcha — `end-0` + `translate-x` mismatch

CSS logical inset (`end-0`, `start-0`) IS direction-aware, but CSS transforms
(`translate-x`, Framer Motion's `x`) are **physical** — `translateX(100%)`
always moves the element 100% of its width to the visual right regardless of
`dir`. The combination `end-0` + `x: '100%'` slides a drawer to the visual
left in RTL, away from the hamburger trigger on the right.

For a drawer that opens from the same side as the hamburger button (Hebrew
default — top-right trigger), use `start-0` + `x: '100%'` so the panel anchors
on the inline-start (visual right in RTL) and the off-screen state is to the
visual right of the viewport. Document the physical-vs-logical mix in a
comment so the next reader doesn't "fix" it.

Recurring offender: mobile sidebar drawers using Framer Motion or a static
`translate-x-full` toggle.

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

### ✅ Fixed (2026-05-13, batch 5 — sweep complete — `fix/rtl-batch-5-sweep-complete`)

Single-branch sweep finishing the carryover from batch 4 plus everything the
margin-only strict grep had missed. ~48 conversions across 27 production files
+ test-file fix-up for stale `right-3` / `left-3` / `right-0` assertions
left over from batch 3.

**Tables (`text-right` → `text-start`):**
`UsersTab.tsx` (6), `AmmunitionReportsList.tsx`, `PlannedTrainingsTable.tsx`,
`AmmunitionBellyView.tsx`, `AmmunitionInventoryView.tsx`,
`AmmunitionTemplatesSection.tsx`, `AmmunitionReportsSection.tsx`,
`CentralStockSection.tsx`, `BulkTemplateImportModal.tsx`, `phone-book/page.tsx`,
`SoldiersTableDesktop.tsx` (4), `GeneratedScheduleTable.tsx`.

**Registration (`text-right` → `text-end`, `left-3` → `end-3`):**
`PersonalDetailsStep.tsx` (5 hits — input + 4 error rows; `text-left` on date
input kept per `<input type="date">` exemption documented at line 145),
`RegistrationForm.tsx` (3 — input + icon + error), `OTPVerificationStep.tsx` (1
— icon), `RegistrationStepDots.tsx` (1 — tooltip triangle
`border-l-2 border-r-2` → `border-s-2 border-e-2`; `left-1/2` centering kept).

**Dropdowns / auth:**
`AuthButton.tsx` (8 — all `text-right` → `text-start` on dropdown menu items
and labels), `LoggedOutLanding.tsx` (1 — list item).

**Status page (mobile + desktop):**
`SoldiersTableMobile.tsx` (2 filter-button `text-right` → `text-start`,
2 dropdown `left-0 right-0` → `start-0 end-0`),
`SoldiersTableDesktop.tsx` (2 dropdown `left-0` → `start-0`),
`status/page.tsx` (1 footer `left-0 right-0` → `start-0 end-0`).

**Sidebars / FAB:**
`ManagementSidebar.tsx`, `AppSidebar.tsx`, `HamburgerMenu.tsx` (each
`right-0` → `end-0`), `QuickActionFab.tsx` (`right-5` → `end-5`).

**Notifications:**
`NotificationItem.tsx` (`border-r-2` → `border-e-2` on unread indicator,
`left-2` → `end-2` on dot), `NotificationBell.tsx` (2 `-right-1` → `-end-1` on
badges).

**Misc:**
`TransferModal.tsx` (2 search-result `text-right` → `text-end`),
`TemplatesTab.tsx` (1 disclosure-button `text-right` → `text-start`).

**Test fixup (drive-by):**
`AccountDetailsStep.test.tsx` — updated 14 stale assertions referencing
removed physical classes (`right-3`/`left-3`/`right-0`) to the logical
classes (`start-3`/`end-3`/`start-0`) that batch 3 actually shipped. Reduced
failing tests from 10 → 4 (remaining 4 are unrelated validation/tooltip-styling
issues that pre-date this branch).

### ✅ Fixed (2026-05-14 — `fix/rtl-mobile-menu-clings-to-left`)

Post-audit regression spotted in production: mobile hamburger drawers were
sliding to the visual **left** in RTL instead of right (away from the
hamburger trigger). Root cause is documented above in the "Slide-out drawer
gotcha" — the `end-0` + `translate-x: 100%` combo mismatches logical inset
with physical transform.

- `src/app/components/AppSidebar.tsx` — primary mobile drawer used by every
  `AppShell`-wrapped page. `end-0` → `start-0`.
- `src/components/management/sidebar/ManagementSidebar.tsx` — `/management`
  page sidebar (uses `lg:relative` to switch to inline layout above the
  breakpoint, so the inset only applies on mobile). `end-0` → `start-0`.
- `src/components/ui/HamburgerMenu.tsx` — legacy drawer with no remaining
  callers in `src/`, fixed for consistency in case it's revived.

All three carry an inline comment explaining the physical-vs-logical mix.

### Guidelines for new code

When adding or editing UI, default to logical Tailwind properties from the
first commit. Repeat the audit grep on new code:

```
(\s|"|')(pl-|pr-|ml-|mr-)\d|text-left|text-right|\bleft-\d|\bright-\d|border-l-\d|border-r-\d
```

If you must use physical classes (e.g., for direction-specific gradient
overlays where logical doesn't make sense), add a one-line `// physical OK:
<reason>` comment so future grep sweeps know to skip.

Pattern for password / email input pairs:
- Hebrew text-input: `text-end` (not `text-right`)
- Reserve space for trailing icon: `pe-12` (not `pr-12`) when icon at `end-3`
- Reserve space for leading icon: `ps-12` (not `pl-12`) when icon at `start-3`
- Absolute icon positioning: `start-3` / `end-3` (not `left-3` / `right-3`)
- Borders: `border-s-*` / `border-e-*` (not `border-l-*` / `border-r-*`)

`justify-end` on modal-footer CTA rows IS intentional — flex `justify-end`
end-aligns the primary button regardless of `dir` because the container's
inline-end is the visual end. Do not flag those.

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
