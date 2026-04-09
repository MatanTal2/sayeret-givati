# CustomUserSelectionModal.tsx

**File:** `src/components/management/tabs/CustomUserSelectionModal.tsx`  
**Lines:** 328 ⚠️ LONG  
**Status:** Active

## Purpose

Modal for multi-select user selection with search, alphabet filtering, and sort-by-name. Used by `EmailTab` to pick custom recipients. Loads real user data from `useUsers()`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `onConfirm` | `(selectedUsers: string[]) => void` | ✅ | Confirm with selected user IDs |
| `preSelectedUsers` | `string[]` | ❌ | Pre-checked user IDs |

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Text search |
| `selectedUserIds` | `Set<string>` | Currently checked users |
| `sortDirection` | `'asc' \| 'desc'` | Name sort direction |
| `alphabetFilter` | `string` | Hebrew letter filter |

## Firebase Operations

- **Read:** `useUsers()` — reads from `users` collection

## Known Issues

- Extensive inline Hebrew.
- Uses Hebrew locale compare for sorting.
- 328 lines — at the split threshold.
