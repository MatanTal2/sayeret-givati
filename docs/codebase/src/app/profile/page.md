# page.tsx (Profile)

**File:** `src/app/profile/page.tsx`
**Status:** Active

## Purpose

User profile page (`/profile`). Displays the authenticated user's personal and military information from `AuthContext.enhancedUser` (Firestore profile). Editable sections (Military Info, Contact Info) use a section-level pencil toggle pattern owned by sibling components; Personal Info and System Info are read-only and rendered inline. Protected by `AuthGuard`.

## Exports / Public API

- `default ProfilePage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `profileImageUrl` | `string \| undefined` | Local mirror of `enhancedUser.profileImage`, synced via `useEffect` whenever the source changes |
| `phoneNumber` | `string` | Local mirror of `enhancedUser.phoneNumber`, synced via `useEffect`; passed into `ContactInfoSection` |

All other editable state (teamId, enlistmentCycle, address) lives inside the dedicated section components (`MilitaryInfoSection`, `ContactInfoSection`).

## Card layout

The body grid renders four cards in this fixed order:

1. **Personal Information** (read-only) — first/last name, gender, birthday.
2. **Military Information** (editable: team, enlistment cycle) — `<MilitaryInfoSection>`. Rank, role, join date, status stay read-only. The "Team & Unit Assignment" standalone card that previously sat between Military Info and Contact Info has been removed; the `teamId` field is now inline inside Military Info and edited via the same section-edit pattern.
3. **Contact Information** (editable: address) — `<ContactInfoSection>`. Email is read-only. Phone uses the existing `<PhoneNumberUpdate>` sub-component nested inside.
4. **System Information** (read-only) — uid, user type, test-account badge.

## Persistence path

All writes go through `updateUserProfile` (client wrapper in `src/lib/userProfileService.ts`) which posts to `PATCH /api/users/profile`. The server route filters against `PROFILE_WRITABLE_FIELDS` (currently `teamId`, `profileImage`, `phoneNumber`, `enlistmentCycle`, `address`) and writes via `firebase-admin`. After every successful section save the component calls `refreshEnhancedUser()` from `AuthContext` so the rest of the app sees the new value.

## Hydration model

The page seeds local state to empty/undefined, then `useEffect` hooks watch each `enhancedUser` field and rehydrate when the async profile fetch in `AuthContext` resolves. The section components own their own edit-mode buffers and re-sync against `user.*` whenever the source-of-truth changes (post-save refresh or first-render hydration).

## Layout notes

- Header card uses `flex-wrap` with `shrink-0` on avatar and status badge, and `ms-auto` on the badge so the RTL layout puts the badge at the visual end of the row rather than escaping to the leading edge.
- Personal Info and Military Info use a `<dl>` with `sm:grid sm:grid-cols-3` so labels and values inline on tablet/desktop and stack on mobile.
- All section headers wrap (`flex-wrap`) and the icon has `shrink-0` so it never gets clipped at narrow widths.
- Mobile padding is reduced (`p-4 sm:p-6`) across all cards for consistency.
- The pencil "Edit" button sits at the top-leading corner of each editable section, opposite the title, and is hidden while in edit mode (replaced by Save/Cancel at the section footer).

## Date formatting

Uses `date-fns` with `he` locale. Handles both `Date` objects and Firestore `Timestamp` (duck-typed via `toDate()`). The enlistment-cycle field is stored as ISO `YYYY-MM` and displayed via `format(parse(value, 'yyyy-MM'), 'MMMM yyyy', { locale: he })` (e.g. `2010-03` → `מרץ 2010`).

## Related queued work

- Image editor v2 (pan + wider zoom + group-photo focus) — still queued.
- Profile image localStorage cache — still queued.
- Soldier qualifications + personal logistics — blocked on 6 open product Qs (see `project_soldier_qualifications`).
