# adminUtils.ts

**File:** `src/lib/adminUtils.ts`  
**Lines:** 881 ⚠️ LONG  
**Status:** Active

## Purpose

Admin functionality combining security utilities, input validation, session management, and Firestore CRUD for authorized personnel. The largest service file in the codebase.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `AdminError` | class | Custom error with error code |
| `SecurityUtils` | class (static) | `hashPassword()`, `verifyPassword()`, `generateToken()`, `isTokenExpired()` |
| `ValidationUtils` | class (static) | `validatePersonalNumber()`, `validateName()`, `validatePhoneNumber()`, `validateEmail()`, `validateBulkData()` |
| `AdminFirestoreService` | class (static) | `getPersonnel()`, `addPersonnel()`, `updatePersonnel()`, `deletePersonnel()`, `searchPersonnel()`, `getPersonnelStats()`, `bulkAddPersonnel()`, `getRegisteredUsers()` |
| `SessionUtils` | class (static) | `createSession()`, `validateSession()`, `destroySession()` |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `authorized_personnel` | `getDoc` | `getPersonnel()` |
| `authorized_personnel` | `getDocs` | `searchPersonnel()`, `getPersonnelStats()`, `bulkAddPersonnel()` (duplicate check) |
| `authorized_personnel` | `setDoc` | `addPersonnel()` |
| `authorized_personnel` | `updateDoc` | `updatePersonnel()` |
| `authorized_personnel` | `deleteDoc` | `deletePersonnel()` |
| `authorized_personnel` | `writeBatch` | `bulkAddPersonnel()` |
| `users` | `getDocs`, `query(where)` | `getRegisteredUsers()` |
| `users` | `updateDoc` | `updatePersonnel()` (syncs changes to user profile) |
| `admin_config` | `getDoc` | `SecurityUtils` (password verification) |

## Notes

- 881 lines — largest service file. Should be split: SecurityUtils, ValidationUtils, AdminFirestoreService, and SessionUtils are four distinct concerns.
- Mixes security, validation, Firestore CRUD, and session management.
- `ValidationUtils.normalizePhoneInput(raw)` strips every non-digit except a leading `+`, so admin AddPersonnel / BulkUpload / UpdatePersonnel tolerate spaces, dashes, dots, parens, and multiple separators in user input. `isValidIsraeliMobile` and `toInternationalFormat` both call it. `updateAuthorizedPersonnel` normalizes phone before the duplicate check and before persisting via the API. Bug #2 fix.
