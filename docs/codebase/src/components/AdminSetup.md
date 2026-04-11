# AdminSetup.tsx

**File:** `src/components/AdminSetup.tsx`  
**Lines:** 134  
**Status:** Active (dev-only)

## Purpose

Admin account creation utility. Creates a Firebase Auth user for the admin and displays credentials. Requires manual Firestore update to set admin role.

## State

| State | Type | Purpose |
|-------|------|---------|
| `status` | `string` | Operation status |
| `isLoading` | `boolean` | Creation in progress |
| `isCreated` | `boolean` | Account created |
| `password` | `string` | Generated/entered password |

## Firebase Operations

- **Auth:** `createUserWithEmailAndPassword`, `signOut`

## Notes

- Dev-only utility — should be removed or gated in production.
- Inline Hebrew text.
