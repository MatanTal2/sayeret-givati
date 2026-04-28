# AddPersonnel.tsx

**File:** `src/app/admin/components/AddPersonnel.tsx`
**Status:** Active

## Purpose

Form for adding a single authorized person to the `authorized_personnel` collection. Fields: military personal number, first name, last name, rank (`RANK_OPTIONS`), user type (`USER_TYPE_OPTIONS`), phone number.

## Props

None — pulls form state from `usePersonnelManagement`.

## Submit-feedback state machine

The component owns a local `SubmitState` (`idle | submitting | success | error`) and a `StatusDetail` discriminated union. It drives both the submit button and an inline status block below the form, modeled on `ProfileImageUpload`'s auto-dismiss pattern.

Flow:
1. `handleSubmit` snapshots `firstName lastName` + `militaryPersonalNumber` from `formData` *before* awaiting (the hook's `resetForm` clears these on success).
2. Calls `addPersonnel()` which returns `PersonnelOperationResult`.
3. On success: status block shows "נוסף בהצלחה" with `${name} (${militaryId})`, button briefly flashes green check.
4. On failure: status block shows backend `result.message` under "הוספת כוח אדם נכשלה", button briefly flashes red X.
5. After `AUTO_DISMISS_MS` (3000ms) state reverts to `idle` and the status block clears. Typing in any field also clears the status immediately. Manual dismiss via the X button on the status block.

Cleanup of the dismiss `setTimeout` is handled in a `useEffect` cleanup return.

## Hook contract change

`usePersonnelManagement.addPersonnel` now returns `Promise<PersonnelOperationResult>` (was `Promise<void>`). Other consumers can use this to drive their own UX. The hook still populates `message` for backward compatibility, but `AddPersonnel` ignores the hook message and uses local state only.

## Text constants

All Hebrew submit-feedback strings live in `src/constants/text.ts` under `ADMIN_COMPONENTS`:

- `PERSONNEL_ADD_SUBMIT` — idle button label
- `PERSONNEL_ADD_SUBMITTING` — in-flight button label
- `PERSONNEL_ADDED_TITLE` — success headline
- `PERSONNEL_ADDED_HINT` — success hint line
- `PERSONNEL_ADD_ERROR_TITLE` — error headline
- `DISMISS` — aria-label for the close button

## Layout

Compact two-column grid (`md:grid-cols-2 gap-4`):

| Row | Fields |
|---|---|
| 1 | מספר אישי (max 7) · מספר טלפון |
| 2 | שם פרטי · שם משפחה |
| 3 | דרגה · סוג משתמש |

All labels Hebrew. RTL-aware spacing only (`ms-`, `me-`, `gap-` — no `ml-`/`mr-`/`space-x-`).

## Notes

- Submit button uses the `btn-primary` design-token class with state-conditional `bg-success-600` / `bg-danger-600` overrides combined via `cn()` from `src/lib/cn.ts`.
- Icons (`Check`, `X`) come from `lucide-react`.
- Page chrome (top bar with profile menu, page title, sidebar) is provided by `AppShell` (`src/app/components/AppShell.tsx`) — `AddPersonnel` renders only the form.
- Known bug: name fields reject `-` and `'` characters (see `docs/bugs.md` #1).
