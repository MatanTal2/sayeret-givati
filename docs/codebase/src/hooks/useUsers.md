# useUsers.ts

**File:** `src/hooks/useUsers.ts`  
**Lines:** 135  
**Status:** Active

## Purpose

Fetches active users from Firestore for email operations and user selection modals.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `useUsers` | hook | Returns `{ users: UserForEmail[], loading, error, fetchUsers }` |
| `getTeamFromRole` | function | Extracts team name from role string |
| `getRoleDisplayName` | function | Maps role to Hebrew display name |

## Firebase Operations

- **Read:** `getDocs(query(collection(db, 'users'), where('status', '==', 'active')))` — direct Firestore query
