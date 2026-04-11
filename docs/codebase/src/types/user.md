# types/user.ts

**File:** `src/types/user.ts`  
**Lines:** 97  
**Status:** Active

## Purpose

User profile and role types. Defines the `UserType` enum and Firestore user profile interfaces.

## Exports

- `UserType` — enum: `USER`, `TEAM_LEADER`, `MANAGER`, `SYSTEM_MANAGER`, `ADMIN`
- `EnhancedAuthUser` — Firebase Auth user enriched with Firestore profile fields
- `FirestoreUserProfile` — raw Firestore `users` document shape
- `CommunicationPreferences` — notification preference settings
