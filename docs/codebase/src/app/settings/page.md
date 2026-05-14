# page.tsx (Settings)

**File:** `src/app/settings/page.tsx`
**Lines:** 400 ⚠️ LONG — split recommended
**Status:** Active (UI-only — no backend writes implemented)

## Purpose

Settings page (`/settings`). Provides a comprehensive settings UI covering profile management, notification preferences, display options, and account security. All interactive controls are **UI-only placeholders** — toggle and button handlers log to console but perform no Firestore writes. Protected by `AuthGuard`.

## Exports / Public API

- `default SettingsPage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `notifPrefs` | `Record<NotifPrefKey, boolean>` | Persisted notification toggles, seeded from `enhancedUser.communicationPreferences` (with defaults). Optimistic-updated on click; an effect resyncs whenever `AuthContext` produces fresh prefs. |
| `savingPref` | `NotifPrefKey \| null` | Which toggle has a network call in flight; disables the row and shows `cursor-wait`. |
| `settings` | `{ language, theme }` | Local UI-only state — language/theme toggles are still placeholders (PR-F i18n + theming queued). |
| `profileImageUrl` | `string \| undefined` | Profile image optimistic local state. Seeded from `readProfileImageCache(enhancedUser.uid)` to paint instantly on reload; `useEffect` revalidates against `enhancedUser.profileImage` and writes back. See `docs/codebase/src/lib/profileImageCache.md`. |
| `changePasswordOpen` / `changePhoneOpen` / `deleteAccountOpen` | `boolean` | Modal visibility flags. |
| `cancellingDeletion` | `boolean` | Tracks the cancel-deletion API call. |

## Wired actions (real backend)

- **Change password** — opens `<ChangePasswordModal>` (`src/components/settings/ChangePasswordModal.tsx`). Re-authenticates via Firebase, then `updatePassword`. Success → toast via `useToast`. Errors mapped through `mapFirebaseAuthError`. See PR-B in `project_settings_page.md`.
- **Change phone** — opens `<ChangePhoneModal>` (PR-C). Triggers OTP flow against `/api/users/phone-change/*`.
- **Account activity** — `<AccountActivitySection>` renders a collapsible read of the user's `credentialAuditLog` via `GET /api/auth/audit`. Shows event kind, timestamp, actor (self / admin), IP, and User-Agent. See `docs/codebase/src/components/settings/AccountActivitySection.md`.
- **Sign out other devices** — `<RevokeSessionsRow>` renders inside the Account Security section. Posts to `/api/users/sessions/revoke` which bumps `users.sessionEpoch`, killing every other device on the next API hit. Writes a `SESSIONS_REVOKED` audit row. See `docs/codebase/src/components/settings/RevokeSessionsRow.md`.
- **Notification preferences** — `<NotificationToggleRow>` (per row) calls `handleNotifToggle(key)`, which PATCHes `/api/users/profile` with `{ communicationPreferences: { [key]: nextValue } }`. Optimistic — toggle flips immediately; on error the previous value is restored and a danger toast surfaces. `await refreshEnhancedUser()` reloads the source-of-truth after a successful write.

## Known Issues / TODO

- `handleButtonClick` — logs to console, no action (used by the disabled "request permission" button — PR-H).
- `handleImageUpdate` — does not yet persist image to Firestore from this page (the `<ProfileImageUpload>` component handles its own Storage upload; the local state here is purely for the immediate preview).
- `mockPhoneNumber` and `mockPendingTransfers` are hardcoded placeholder values.
- Language and theme toggles still UI-only — pending i18n PR-F.

## Notes

- Comment in source: "All functionality is UI-only (placeholders) as requested."
- `dir="rtl"` added on wrapper div — redundant (already on `<html>`).
- This page is 400 lines with many repeated section patterns (each settings group is a card). Good candidate for extracting `SettingsSection` and `SettingsToggleRow` sub-components.
