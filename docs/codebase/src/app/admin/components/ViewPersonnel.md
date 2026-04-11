# ViewPersonnel.tsx

**File:** `src/app/admin/components/ViewPersonnel.tsx`
**Lines:** 449 ⚠️ LONG — split recommended
**Status:** Active

## Purpose

Personnel list view in the admin panel. Loads all `authorized_personnel` records and renders them in a searchable, filterable, sortable table. Supports search by name or phone number (smart detection), filter by rank, user type, and registration status, sort by name/rank/created date. Delete confirmation is shown in a `ConfirmationModal`.

## Props

None — reads from `usePersonnelManagement`.

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Name or phone search |
| `selectedRank` | `string` | Rank filter |
| `selectedUserType` | `string` | User type filter |
| `registrationFilter` | `'all' \| 'registered' \| 'pending'` | Registration status filter |
| `sortBy` | `'name' \| 'rank' \| 'created'` | Sort column |
| `sortOrder` | `'asc' \| 'desc'` | Sort direction |
| `deleteModal` | `{ isOpen, personId, personName }` | Delete confirmation state |

## Known Issues / TODO

- `isRegistered` field is present in data but not prominently displayed in the table row (known bug).
