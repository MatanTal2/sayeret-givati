# AuthContext.tsx

**File:** `src/contexts/AuthContext.tsx`  
**Lines:** 272  
**Status:** Active

## Purpose

Global authentication state provider. Wraps Firebase Auth with Firestore user profile enrichment. Provides `user` (Firebase Auth), `enhancedUser` (with Firestore profile data including `userType`, `firstName`, `lastName`, `role`), login/logout methods, and a `showAuthModal` flag for triggering the global login/registration modal.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `AuthProvider` | component | Context provider — wraps app in `RootLayout` |
| `useAuth` | hook | Access auth state and methods |
| `AuthUser` | type | Firebase Auth user subset |
| `AuthContextType` | type | Full context shape |
| `AuthCredentials` | type | `{ email, password }` |
| `FormMessage` | type | `{ type: 'success' \| 'error', text }` |

## Context Value

```typescript
{
  user: User | null,
  enhancedUser: EnhancedAuthUser | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  message: FormMessage | null,
  login: (creds: AuthCredentials) => Promise<void>,
  logout: () => Promise<void>,
  clearMessage: () => void,
  showAuthModal: boolean,
  setShowAuthModal: (show: boolean) => void
}
```

## Firebase Operations

- **Auth:** `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`
- **Read:** `UserDataService.fetchUserDataByUid` — enriches auth user with Firestore profile

## Known Issues

- Console.log statements left in.
- Fallback email-based admin check via `ADMIN_CONFIG.EMAIL`.
- `enhancedUser` and `user` can be temporarily out of sync during profile fetch.
