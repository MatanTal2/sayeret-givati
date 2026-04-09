# page.tsx (Profile)

**File:** `src/app/profile/page.tsx`
**Lines:** 277
**Status:** Active

## Purpose

User profile page (`/profile`). Displays the authenticated user's personal and military information from `AuthContext.enhancedUser` (Firestore profile). Allows updating the profile image and phone number via dedicated sub-components. Protected by `AuthGuard`.

## Exports / Public API

- `default ProfilePage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `profileImageUrl` | `string \| undefined` | Local copy of profile image URL, updated optimistically |
| `phoneNumber` | `string` | Local copy of phone number |

## Notes

- **TODO (line 52):** `handleImageUpdate` logs the new URL but does not write it to Firestore. Firestore update is not implemented.
- **TODO (line 58):** `handlePhoneUpdate` logs the new phone but does not write to `users` or `authorized_personnel`. Firestore update is not implemented.
- Date formatting uses `date-fns` with `he` (Hebrew) locale. Handles both `Date` objects and Firestore `Timestamp` (duck-typed via `toDate()`).
