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
| `editForm` | `{ firstName, lastName, rank, phoneNumber, userType, status, approvedRole }` | Edit form values. `status` is `'active' \| 'inactive' \| 'transferred' \| 'discharged'` (bug #3 fix). `approvedRole` is `UserRole` (bug #7 fix; defaults to `UserRole.SOLDIER`). |
| `isUpdating` | `boolean` | Update submission in progress |
| `updateMessage` | `{ text, type } \| null` | Success/error feedback |

## Known Issues / TODO

- `updatePersonnel` in `usePersonnelManagement` is partially implemented — the write to Firestore via `adminUtils` may not be complete (known bug in `docs/bugs.md`).

## Notes

- Search-result rows render the `registered` / pending badge alongside rank, phone, userType, and military role (bug #4 + #7 fixes). Selected-person details panel already showed registration status under "סטטוס רישום".
- Military role (`approvedRole`) is editable via Headless UI `Listbox` (`USER_ROLE_OPTIONS`). Display badge uses `USER_ROLE_LABELS` for Hebrew rendering. Role changes propagate to the synced `users` doc via `shouldSync` when the soldier is registered.
