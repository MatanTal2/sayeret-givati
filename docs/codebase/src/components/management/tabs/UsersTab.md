# UsersTab.tsx

**File:** `src/components/management/tabs/UsersTab.tsx`  
**Lines:** 325 ⚠️ LONG  
**Status:** Active

## Purpose

User management table with search, role/status filtering, and summary statistics (total users, active, managers, new this month). Displays a responsive table of all users from `useUsers()` hook.

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Text search across users |
| `selectedRole` | `string` | Role filter dropdown |
| `selectedStatus` | `string` | Status filter dropdown |

## Firebase Operations

- **Read:** `useUsers()` — reads from `users` collection

## Known Issues

- Extensive inline Hebrew throughout.
- Role mapping duplicated (lines 23-31).
- 325 lines — at the split threshold.
