# firebasePhoneAuth.ts

**File:** `src/lib/firebasePhoneAuth.ts`
**Status:** Active

## Purpose

Centralized wrapper around Firebase Phone Auth + email/password linking + email verification + password reset, plus a Hebrew error-message mapper. All registration and OTP-related Firebase calls in the codebase go through this module so the verifier lifecycle and error UX live in one place.

## Exports

| Export | Description |
|--------|-------------|
| `initRecaptcha(containerId)` | Returns a cached invisible `RecaptchaVerifier` bound to the given DOM container. Idempotent. |
| `resetRecaptcha()` | Clears the cached verifier (used between sends and on unmount). |
| `sendPhoneOtp(phoneE164, verifier)` | `signInWithPhoneNumber(auth, phoneE164, verifier)` → `ConfirmationResult`. Phone must already be E.164. |
| `confirmPhoneOtp(confirmation, code)` | `confirmation.confirm(code)` → `UserCredential`. Creates / signs in the Firebase Auth user. |
| `linkEmailPassword(user, email, password)` | Builds an `EmailAuthProvider.credential` and `linkWithCredential(user, credential)`. Adds an email/password provider to an already signed-in user. |
| `sendVerificationEmail(user)` | `sendEmailVerification(user)` — soft email verify trigger. |
| `sendPasswordReset(email)` | `sendPasswordResetEmail(auth, email)` — used by `/forgot-password`. |
| `mapFirebaseAuthError(error)` | Maps Firebase error `code` strings to Hebrew messages from `TEXT_CONSTANTS.AUTH`. Falls back to `OTP_INTERNAL_ERROR`. |

## Notes

- The wrapper purposely does not pass `auth` from outside — it imports the singleton from `src/lib/firebase.ts` so callers can't accidentally use the wrong instance.
- Verifier caching: the first `initRecaptcha` call instantiates `RecaptchaVerifier`; subsequent calls return the cached instance. Resend flows must call `resetRecaptcha()` first to force a new challenge.
- All Hebrew strings live in `src/constants/text.ts`. Adding a new error code? Update `mapFirebaseAuthError` and add the constant.
