# userService.ts

**File:** `src/lib/userService.ts`  
**Lines:** 373 ⚠️ LONG  
**Status:** Active

## Purpose

User registration, profile creation, and search. Handles the multi-step registration flow: verify against `authorized_personnel`, create Firebase Auth account, write user profile to `users`, and mark personnel as registered. Also provides user search for transfer modals.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `RegistrationData` | interface | Registration form data shape |
| `UserProfile` | interface | Firestore user profile shape |
| `UserRegistrationResult` | interface | Registration result with user + profile |
| `UserService` | class (static) | `registerUser()`, `verifyPersonnel()`, `createUserProfile()` |
| `UserSearchResult` | interface | `{ uid, displayName, email, role }` |
| `searchUsers` | `(query, limit?) => Promise<UserSearchResult[]>` | Search users by name/email |
| `getUserProfile` | `(uid) => Promise<UserProfile \| null>` | Fetch single user profile |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `users` | `setDoc` | `createUserProfile()` |
| `users` | `getDoc` | `getUserProfile()` |
| `users` | `getDocs`, `query(where, limit)` | `searchUsers()` |
| `authorized_personnel` | `getDoc` | `verifyPersonnel()` |
| `authorized_personnel` | `updateDoc` | `registerUser()` (marks `isRegistered: true`) |

## Notes

- Mock users added in development mode for testing.
- 373 lines — could split registration from search.
