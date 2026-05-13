# ChangePasswordModal.tsx

**File:** `src/components/settings/ChangePasswordModal.tsx`
**Status:** Active (Settings PR-B)

## Purpose

Modal dialog that lets a signed-in user change their account password. Mounted by `/settings` and opened when the user clicks the "שנה סיסמה" button.

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controls dialog visibility |
| `onClose` | `() => void` | Closes the dialog. Disabled while a submit is in flight to avoid losing the spinner state |
| `onSuccess` | `() => void` | Called after a successful password change; the page wires this to a toast |

## Flow

1. User types current + new + confirm-new password.
2. Client validates: all three filled, new ≥ 6 chars (Firebase default minimum), new === confirm, new !== current.
3. Submit calls `changePassword(currentPassword, newPassword)` from `src/lib/firebasePhoneAuth.ts`.
4. Helper performs `reauthenticateWithCredential(EmailAuthProvider.credential(email, current))` then `updatePassword(user, new)`.
5. On any error, `mapFirebaseAuthError` translates to a Hebrew message rendered inline (`role="alert"`).
6. On success, the modal calls `onSuccess()` and closes.

## Error surfaces

- `auth/wrong-password` / `auth/invalid-credential` / `auth/invalid-login-credentials` → "הסיסמה הנוכחית שגויה." (`WRONG_PASSWORD`)
- `auth/weak-password` → "הסיסמה חלשה מדי..." (`WEAK_PASSWORD`) — also pre-emptively blocked by the client-side length check
- `auth/requires-recent-login` → mapped via `RequiresRecentLoginError` in the helper; surfaces "הפעולה דורשת התחברות מחדש..." (`REQUIRES_RECENT_LOGIN`). When this lands in production the modal should escalate to a logout + re-login prompt (TODO)
- All other Firebase errors fall through to the default `OTP_INTERNAL_ERROR` mapping

## UI

- Built on Headless UI `Dialog` / `DialogBackdrop` / `DialogPanel` / `DialogTitle` per `feedback_ui_libs`.
- Three reusable `PasswordField` instances inside the modal — each has its own show/hide eye toggle (`tabIndex={-1}` so it doesn't steal tab focus from the form).
- Submit button uses `btn-primary`; secondary actions use `btn-ghost`. Both classes come from `globals.css` `@layer components`.
- All state resets on `open` transition so a reopened modal never leaks the previous attempt's values.

## Localization

Hebrew strings live in `TEXT_CONSTANTS.SETTINGS.*`. English mirrors in `src/constants/text.en.ts` per `feedback_bilingual_text`. The runtime still reads Hebrew only until the i18n PR lands a locale-aware accessor.
