# useAdminAuth.ts

**File:** `src/hooks/useAdminAuth.ts`  
**Lines:** 213  
**Status:** Active

## Purpose

Firebase authentication and admin role verification for the admin dashboard. Handles login, logout, session checking, and admin status verification via `UserDataService`.

## Return Shape

```typescript
{
  isAuthenticated, isLoading, message, showLogoutModal,
  login, requestLogout, confirmLogout, cancelLogout, checkSession, clearMessage
}
```

## Firebase Operations

- **Auth:** `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`
- **Read:** `UserDataService.fetchUserDataByUid` — checks admin role in `users` collection

## Known Issues

- Fallback email check via `ADMIN_CONFIG.EMAIL` — low security.
