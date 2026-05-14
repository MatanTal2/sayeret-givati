# ChangePhoneModal.tsx

**File:** `src/components/settings/ChangePhoneModal.tsx`
**Status:** Active (Settings PR-C)

## Purpose

Four-step modal that lets a signed-in user change their phone number. Mounted by `/settings` and opened when the user clicks the "עדכן" button next to the phone row.

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controls dialog visibility |
| `onClose` | `() => void` | Closes the dialog; the wrapper calls `cancelPhoneChange()` on close so an orphan pending doesn't survive a mid-flow bail |
| `onSuccess` | `() => void` | Called after a successful phone change; page wires to a toast |

## State machine

```
idle (modal closed)
  ↓ open
preflight — explainer card (SMS, reauth, other-devices logout, rate limit)
  ↓ "התחל שינוי מספר"
reauth — current password input
  ↓ reauth succeeds
enterNumber — new phone E.164 input + reset reCAPTCHA + send OTP
  ↓ verifyPhoneNumber resolves
enterOtp — 6-digit code input
  ↓ submit
  POST /api/users/phone-change/initiate (server returns nonce)
  ↓
  applyVerifiedPhoneCredential (Firebase updatePhoneNumber + force-refresh idToken)
  ↓
  POST /api/users/phone-change/confirm (server validates + mirrors + sessionEpoch fence)
  ↓
success — green confirmation card + optional manual "sign out other devices now" CTA
  ↓ Done (or X / backdrop)
onSuccess() fires → modal closes
```

A "חזור — שנה מספר" link in `enterOtp` resets back to `enterNumber` and invalidates the prior `verificationId` so a new SMS can be requested with a different number.

## Cleanup discipline

- Form / step / reCAPTCHA state all reset on `open` transition. Re-opening the modal never leaks stale input.
- `resetRecaptcha()` runs both on mount and before every fresh `verifyPhoneNumber` call so the module-level `cachedVerifier` doesn't reuse a consumed token (Firebase Phone Auth + invisible reCAPTCHA = one-time-use tokens).
- A `hasPendingRef` flag tracks whether `/initiate` has written a pending doc but `/confirm` hasn't deleted it. On any close path while this flag is set, the modal fires `POST /api/users/phone-change/cancel` so the orphan doesn't block a retry for the 60s rate-limit window.
- When `updatePhoneNumber` throws (e.g. `auth/credential-already-in-use`), the modal explicitly calls cancel BEFORE re-enabling the form, ensuring the next attempt isn't rate-limited by an unused reservation.

## Error surfaces

| Firebase code | UI text constant |
|---|---|
| `auth/wrong-password` / `auth/invalid-credential` | `WRONG_PASSWORD` |
| `auth/requires-recent-login` | `REQUIRES_RECENT_LOGIN` |
| `auth/invalid-phone-number` | `OTP_INVALID_PHONE_FORMAT` |
| `auth/code-expired` / `auth/invalid-verification-code` | `OTP_WRONG_CODE` |
| `auth/credential-already-in-use` | `PHONE_ALREADY_LINKED` (split from `EMAIL_ALREADY_LINKED` in PR-C) |
| Server `code: rate_limited` | `CHANGE_PHONE_RATE_LIMITED` |
| Server `code: same_number` | `CHANGE_PHONE_SAME_NUMBER` |
| Server `code: mirror_failed` | `CHANGE_PHONE_MIRROR_FAILED` |
| anything else | `CHANGE_PHONE_GENERIC_ERROR` |

## Bilingual

Hebrew strings live in `TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_*`. English mirrors in `TEXT_EN.SETTINGS.*` per `feedback_bilingual_text`. The runtime still reads Hebrew until the planned i18n PR (PR-F) lands the locale-aware accessor.

## Deferred polish (out of PR-C)

- ~~Pre-flight explainer card listing the prerequisites before step 1.~~ ✅ Shipped 2026-05-14 on `feat/phone-change-preflight` — new `preflight` step lists SMS, password reauth, other-device logout, and rate limit before the reauth step. Bullets keyed under `CHANGE_PHONE_PREFLIGHT_*`.
- ~~"Sign out other devices now" explicit CTA in the success state.~~ ✅ Shipped 2026-05-14 on `feat/phone-change-sign-out-cta` — new `success` step with green confirmation card + a manual "Sign out other devices now" button that hits `/api/users/sessions/revoke` directly (idempotent bump on top of the `sessionEpoch` fence the confirm route already stamped). On revoke success the button collapses to a "✓ Other devices signed out" badge. `closeAndCleanup` fires `onSuccess()` when dismissed from the success step so the parent toast still surfaces if the user X-closes instead of clicking Done. Strings keyed under `CHANGE_PHONE_SUCCESS_*` + `CHANGE_PHONE_SIGN_OUT_NOW_*`.
- Old-phone notification (email + SMS) — blocked on PR-E channel pick.
