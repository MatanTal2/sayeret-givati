# page.tsx (Profile)

**File:** `src/app/profile/page.tsx`
**Lines:** 363
**Status:** Active

## Purpose

User profile page (`/profile`). Displays the authenticated user's personal and military information from `AuthContext.enhancedUser` (Firestore profile). Allows updating the profile image, phone number, and team assignment via dedicated sub-components and a section-level Save button. Protected by `AuthGuard`.

## Exports / Public API

- `default ProfilePage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `profileImageUrl` | `string \| undefined` | Local mirror of `enhancedUser.profileImage`, synced via `useEffect` whenever the source changes |
| `phoneNumber` | `string` | Local mirror of `enhancedUser.phoneNumber`, synced via `useEffect` |
| `teamId` | `string` | Local mirror of `enhancedUser.teamId`, synced via `useEffect` |
| `assignmentSaving` | `boolean` | Disables the Save button on the Team & Unit Assignment card while a PATCH is in flight |
| `assignmentMessage` | `string \| null` | Inline status text after the Save button is clicked |

## Persistence path

All writes go through `updateUserProfile` (client wrapper in `src/lib/userProfileService.ts`) which posts to `PATCH /api/users/profile`. The route filters fields against an allowlist (`teamId`, `profileImage`, `phoneNumber`) and writes via `firebase-admin`. After every successful write the component calls `refreshEnhancedUser()` from `AuthContext` so the rest of the app sees the new value.

## Hydration model

Local state initializes to empty/undefined, then `useEffect` hooks watch each `enhancedUser` field and rehydrate when the async profile fetch in `AuthContext` resolves. This is why hard refresh now correctly shows the saved profile image, phone, and team — earlier code seeded `useState` from `enhancedUser` at first render, before the Firestore data had arrived.

## Layout notes

- Header card uses `flex-wrap` with `shrink-0` on avatar and status badge, and `ms-auto` on the badge so the RTL layout puts the badge at the visual end of the row rather than escaping to the leading edge.
- Personal Info and Military Info use a `<dl>` with `sm:grid sm:grid-cols-3` so labels and values inline on tablet/desktop and stack on mobile.
- All section headers wrap (`flex-wrap`) and the icon has `shrink-0` so it never gets clipped at narrow widths.
- Mobile padding is reduced (`p-4 sm:p-6`) across all cards for consistency.

## Date formatting

Uses `date-fns` with `he` locale. Handles both `Date` objects and Firestore `Timestamp` (duck-typed via `toDate()`).

## Related queued work

- "My Team" merge into Military Info, enlistment-cycle field, section-level inline edit, and address field — all queued to `project_future_features` memory (2026-05-12 punch list).
