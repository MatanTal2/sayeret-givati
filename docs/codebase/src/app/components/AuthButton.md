# AuthButton.tsx

**File:** `src/app/components/AuthButton.tsx`
**Lines:** 343 ⚠️ LONG — split recommended
**Status:** Active

## Purpose

Global auth button shown in the page header. When unauthenticated: renders a login button that opens the auth modal. When authenticated: renders a user avatar/name button that opens a dropdown menu with links to Profile, Settings, Management (if permitted), and a Logout option. Also renders `NotificationBell`.

## State

| State | Type | Purpose |
|-------|------|---------|
| `isMenuOpen` | `boolean` | Dropdown menu visibility |

## Props

None — reads everything from `AuthContext`.

## Notes

- Contains inline `hasManagementAccess()` logic (checks `userType === 'admin'` or officer/commander role). This duplicates logic that also exists in `useManagementAccess` and `permissionUtils`. Candidate for consolidation.
- Outside-click handling uses a 50ms delay before attaching the listener to prevent immediate close on menu open.
- At 343 lines the component handles too many states (loading, unauthenticated, authenticated). Consider splitting into `AuthButtonUnauthenticated`, `AuthButtonAuthenticated`, and `UserDropdown`.
