# firebase.ts

**File:** `src/lib/firebase.ts`  
**Lines:** 22  
**Status:** Active

## Purpose

Firebase initialization and configuration. Initializes the Firebase app, Firestore database, and Firebase Auth instances using environment variables.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `app` | `FirebaseApp` | Initialized Firebase app instance |
| `db` | `Firestore` | Firestore database instance |
| `auth` | `Auth` | Firebase Auth instance |

## Notes

- All Firestore operations across the codebase use this `db` instance.
- All auth operations use this `auth` instance.
- Mock version exists at `src/lib/__mocks__/firebase.ts` for tests.
