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
| `settings` | `{ emailNotifications, equipmentTransferAlerts, language, theme }` | Local toggle state — not persisted |
| `profileImageUrl` | `string \| undefined` | Profile image optimistic local state. Seeded from `readProfileImageCache(enhancedUser.uid)` to paint instantly on reload; `useEffect` revalidates against `enhancedUser.profileImage` and writes back. See `docs/codebase/src/lib/profileImageCache.md`. |
| `changePasswordOpen` | `boolean` | Controls visibility of `<ChangePasswordModal>` |

## Wired actions (real backend)

- **Change password** — opens `<ChangePasswordModal>` (`src/components/settings/ChangePasswordModal.tsx`). Re-authenticates via Firebase, then `updatePassword`. Success → toast via `useToast`. Errors mapped through `mapFirebaseAuthError`. See PR-B in `project_settings_page.md`.
- **Account activity** — `<AccountActivitySection>` renders a collapsible read of the user's `credentialAuditLog` via `GET /api/auth/audit`. Shows event kind, timestamp, actor (self / admin), IP, and User-Agent. See `docs/codebase/src/components/settings/AccountActivitySection.md`.
- **Sign out other devices** — `<RevokeSessionsRow>` renders inside the Account Security section. Posts to `/api/users/sessions/revoke` which bumps `users.sessionEpoch`, killing every other device on the next API hit. Writes a `SESSIONS_REVOKED` audit row. See `docs/codebase/src/components/settings/RevokeSessionsRow.md`.

## Known Issues / TODO

- Most settings toggles are still UI-only (notifications, language, theme, permission requests, account deletion). Tracked in `project_settings_page.md` PR sequence.
- `handleToggle` — logs to console, changes local state only.
- `handleButtonClick` — logs to console, no action.
- `handleImageUpdate` — does not persist image to Firestore.
- `mockPhoneNumber` and `mockPendingTransfers` are hardcoded placeholder values.

## Notes

- Comment in source: "All functionality is UI-only (placeholders) as requested."
- `dir="rtl"` added on wrapper div — redundant (already on `<html>`).
- This page is 400 lines with many repeated section patterns (each settings group is a card). Good candidate for extracting `SettingsSection` and `SettingsToggleRow` sub-components.
