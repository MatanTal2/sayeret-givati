# PersonnelTab.tsx

**File:** `src/app/admin/components/PersonnelTab.tsx`
**Status:** Active (introduced 2026-05-19 — replaces the
former `ViewPersonnel` + `UpdatePersonnel` pair)

## Purpose

Single admin tab for viewing, filtering, editing, and deleting authorized
personnel. Replaces two previous tabs that shared the same data layer but
diverged only in the row-level action.

## Layout

- **Header strip:** total + filtered badges.
- **Filter bar:** always-visible search input (debounced 300ms) + a
  `SlidersHorizontal` toggle that opens a Headless UI `Disclosure`
  revealing the filter dropdowns. See
  `personnel/PersonnelFiltersBar.tsx`.
- **List:** vertical stack of `PersonnelRow` cards.
- **Delete:** in-app `ConfirmationModal` — no `window.confirm`.

## Row interaction

Rows use the `EquipmentTable` collapse/expand pattern:

- **Collapsed (default):** registration status dot, name (rank inline),
  user-type badge, 3-dots actions menu. Single click / Enter / Space
  toggles expansion. Single-open mode — opening one collapses the
  previous.
- **Expanded — view:** 2-col grid with phone, rank, registration
  status, creation date.
- **Expanded — edit:** same grid swapped for inputs (text for
  name/rank/phone, `Select` for user type). Save + Cancel row + inline
  error.

Esc collapses an expanded row; Esc inside edit mode cancels the edit.

## Sort / filter

Sort and order are combined into a single `Select` with six options
(`created_desc` is default). Filter values are owned by `PersonnelTab`
and passed to `PersonnelFiltersBar` as controlled props.

## Data

`usePersonnelManagement()` is the only data source. Edits invoke
`updatePersonnel(id, changes)` with the diff only; the hook handles
optimistic UI + cache update.

## Validation

`src/lib/personnelValidation.ts` provides the shared rules:
- Hebrew-name regex (matches the registration / single-add rules)
- Israeli phone (accepts `0XX`, `+972`, `972` and `-`/` ` separators)
- Rank membership in `MILITARY_RANKS`

## Sub-components

| File | Purpose |
|------|---------|
| `personnel/PersonnelRow.tsx` | One row: collapsed header + expanded view/edit panel |
| `personnel/PersonnelRowActions.tsx` | 3-dots menu (Edit, Delete) |
| `personnel/PersonnelFiltersBar.tsx` | Search + filter Disclosure |

## Tests

- `src/app/admin/components/personnel/__tests__/PersonnelTab.test.tsx`
- `src/app/admin/components/personnel/__tests__/PersonnelRow.test.tsx`
- `src/app/admin/components/personnel/__tests__/PersonnelFiltersBar.test.tsx`
- `src/lib/__tests__/personnelValidation.test.ts`
- Updated: `src/app/admin/components/__tests__/AdminDashboard.test.tsx`
  covers the `?tab=` URL persistence
