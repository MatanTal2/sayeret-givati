# UpdatePersonnel.tsx

**File:** `src/app/admin/components/UpdatePersonnel.tsx`
**Lines:** 552 ⚠️ LONG — split recommended
**Status:** 🔄 In Progress

## Purpose

Two-step personnel update UI in the admin panel: (1) search/select a person from the personnel list, (2) edit their fields in a form. Updates are submitted via `usePersonnelManagement.updatePersonnel`.

## Props

None — reads from `usePersonnelManagement`.

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Search input for finding a person |
| `selectedPerson` | `AuthorizedPersonnel \| null` | Currently selected person for editing |
| `isEditing` | `boolean` | Whether edit form is open |
| `editForm` | `{ firstName, lastName, rank, phoneNumber, userType }` | Edit form values |
| `isUpdating` | `boolean` | Update submission in progress |
| `updateMessage` | `{ text, type } \| null` | Success/error feedback |

## Known Issues / TODO

- `updatePersonnel` in `usePersonnelManagement` is partially implemented — the write to Firestore via `adminUtils` may not be complete (known bug in `docs/bugs.md`).
