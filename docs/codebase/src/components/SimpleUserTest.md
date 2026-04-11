# SimpleUserTest.tsx

**File:** `src/components/SimpleUserTest.tsx`  
**Lines:** 171  
**Status:** Active (dev-only)

## Purpose

Firebase authentication testing component. Checks Firebase config, creates test user, signs in, tests password reset, and cleans up. Displays test results with status indicators.

## State

| State | Type | Purpose |
|-------|------|---------|
| `status` | `string` | Current test status message |
| `testResults` | `object[]` | Array of test results with pass/fail |
| `isRunning` | `boolean` | Tests in progress |

## Firebase Operations

- **Auth:** `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `deleteUser`, `sendPasswordResetEmail`

## Notes

- Dev-only component — should not be in production.
- Inline Hebrew text.
