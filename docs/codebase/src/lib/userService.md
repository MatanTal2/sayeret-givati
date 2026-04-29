# userService.ts

**File:** `src/lib/userService.ts`
**Status:** Active

## Purpose

User profile reads and search. Registration logic moved to the server route `src/app/api/auth/register/route.ts` (firebase-admin); this file no longer creates accounts.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `UserProfile` | interface | Firestore user profile shape |
| `UserSearchResult` | interface | `{ uid, displayName, email, role }` |
| `searchUsers` | `(query, limit?) => Promise<UserSearchResult[]>` | Search users by name/email |
| `getUserProfile` | `(uid) => Promise<UserProfile \| null>` | Fetch single user profile |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `users` | `getDoc` | `getUserProfile()` |
| `users` | `getDocs`, `query(where, limit)` | `searchUsers()` |

## Notes

- Mock users added in development mode for testing `searchUsers`.
- Registration flow lives in `/api/auth/register` and uses firebase-admin directly. See `src/app/api/auth/register/route.ts`.
