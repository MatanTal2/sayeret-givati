# AddPersonnel.tsx

**File:** `src/app/admin/components/AddPersonnel.tsx`
**Lines:** 276
**Status:** Active

## Purpose

Form for adding a single authorized person to the `authorized_personnel` collection. Uses `usePersonnelManagement` hook for all state and submission. Fields: military personal number, first name, last name, rank (dropdown from `RANK_OPTIONS`), unit, phone, user type (dropdown from `USER_TYPE_OPTIONS`).

## Props

None — fully controlled by `usePersonnelManagement` hook.

## Notes

- All form state lives in the hook, not this component.
- Known bug: name fields reject `-` and `'` characters (see `docs/duplications.md` and `docs/bugs.md`).
