# userDataService.ts

**File:** `src/lib/userDataService.ts`  
**Lines:** 174  
**Status:** Active

## Purpose

Fetch user data by UID or email, with display formatting utilities (initials, display name, first name). Also provides communication preference helpers.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `UserDataService` | class (static) | All methods below |
| `fetchUserDataByUid` | `(uid) => Promise<UserProfile \| null>` | Get user by UID |
| `fetchUserDataByEmail` | `(email) => Promise<UserProfile \| null>` | Get user by email |
| `generateInitials` | `(firstName, lastName) => string` | Create initials string |
| `generateDisplayName` | `(firstName, lastName) => string` | Full display name |
| `getFirstName` | `(displayName) => string` | Extract first name |
| `getCommunicationPreferences` | `(uid) => Promise<Prefs>` | Get notification prefs |
| `hasConfiguredPreferences` | `(uid) => Promise<boolean>` | Check if prefs exist |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `users` | `getDoc` | `fetchUserDataByUid()`, `getCommunicationPreferences()` |
| `users` | `getDocs`, `query(where, limit)` | `fetchUserDataByEmail()` |
