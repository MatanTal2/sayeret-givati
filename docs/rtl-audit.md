# RTL Audit — findings & triage

**Status:** In progress. First batch landed 2026-05-12 on `fix/admin-role-and-status-polish`.
Full sweep is multi-session (505 physical-class hits across 116 .tsx files); this doc
tracks the punch list.

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

### 🟡 Quick-win candidates (next batch)

Files with the highest physical-class density that touch user-visible flows.
Counts are approximate (grep hit-count, not distinct-class-count).

| File | Hits | Notes |
|------|------|-------|
| `src/components/equipment/TransferModal.tsx` | 16 | Modal — likely safe to convert in isolation |
| `src/components/management/tabs/DataManagementTab.tsx` | 17 | Admin tab |
| `src/components/management/tabs/AuditLogsTab.tsx` | 13 | Admin tab |
| `src/components/management/tabs/EnforceTransferTab.tsx` | 12 | Admin tab |
| `src/components/management/tabs/PermissionGrantsTab.tsx` | 12 | Admin tab |
| `src/components/profile/PhoneNumberUpdate.tsx` | 9 | User-facing |
| `src/components/ammunition/AmmunitionTemplateForm.tsx` | 9 | Form |
| `src/components/ammunition/ReportUsageForm.tsx` | 8 | Form |
| `src/app/components/SoldiersTableMobile.tsx` | 9 | Status page mobile (touched in batch 1 for registered-dot) |
| `src/app/components/SoldiersTableDesktop.tsx` | 8 | Status page desktop (touched in batch 1) |

Convert each file in isolation; don't bundle. After each conversion, QA the
affected page on mobile (where misalignment is most visible) and add it to the
"Fixed" list above with a short note.

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

- `src/components/ammunition/PlannedTrainingsTable.tsx:175,178` — uses
  `window.prompt` and `window.alert`. Violates `feedback_no_browser_dialogs`.
  Replace with the existing in-app `ConfirmationModal` / a new
  `TextInputModal` (or extend `ConfirmationModal` with an optional input).
