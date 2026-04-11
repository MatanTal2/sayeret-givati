# FirebasePersistentTest.tsx

**File:** `src/components/FirebasePersistentTest.tsx`  
**Lines:** 389 ⚠️ LONG  
**Status:** Active (dev-only)

## Purpose

Comprehensive Firebase authentication test suite with 5 scenarios: config check, user creation, sign in, password reset, and cleanup. Displays detailed results with pass/fail/error states.

## State

| State | Type | Purpose |
|-------|------|---------|
| `results` | `object[]` | Test scenario results |
| `authResults` | `object[]` | Auth operation results |
| `loading` | `boolean` | Tests in progress |

## Firebase Operations

- **Auth:** `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `deleteUser`, `sendPasswordResetEmail`
- **Firestore:** `setDoc`, `deleteDoc` (test document)

## Notes

- Dev-only component — 389 lines, should be removed or gated in production.
- Extensive inline Hebrew.
