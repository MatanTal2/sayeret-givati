# RegistrationForm.tsx

**File:** `src/components/registration/RegistrationForm.tsx`
**Status:** Active

## Purpose

Step orchestrator for the registration flow. Owns inter-step state (phone number, first/last name, personal/account details, Firebase `ConfirmationResult`, reCAPTCHA verifier lifecycle) and coordinates: military-ID verification → Firebase Phone Auth send → OTP confirm → personal details → account details → `linkWithCredential` (email+password) → `sendEmailVerification` → `/api/auth/register` → success.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `personalNumber` | `string` | ✅ | Military personal number (from parent) |
| `setPersonalNumber` | `(v: string) => void` | ✅ | Update personal number |
| `onSwitchToLogin` | `() => void` | ❌ | Switch to login modal |
| `onStepChange` | `(step) => void` | ❌ | Notify parent of step changes |
| `currentStep` | `RegistrationStep` | ✅ | Controlled step from parent |
| `onRegistrationSuccess` | `() => void` | ❌ | Called on successful completion |

## Auth flow

1. `verify-military-id` API → resolves authorized_personnel.
2. `sendOtpToPhone(phone)` → resets cached reCAPTCHA, mounts `RecaptchaContainer`, calls `firebasePhoneAuth.sendPhoneOtp` → stores `ConfirmationResult`.
3. `OTPVerificationStep` consumes the `ConfirmationResult` and calls `confirmPhoneOtp` on submit. After success, `auth.currentUser` is populated with the phone credential.
4. Personal + account details collected in subsequent steps.
5. `handleAccountDetailsSubmit` → `linkEmailPassword(auth.currentUser, email, password)` attaches an email/password credential to the existing phone-authed user → `sendVerificationEmail` (best-effort) → `POST /api/auth/register` with `{ ..., firebaseAuthUid, emailVerified }`.

## reCAPTCHA

`RecaptchaContainer` is rendered on the personal-number and OTP steps. Verifier is re-initialized on each send (cached + reset on unmount and on resend) — see `firebasePhoneAuth.initRecaptcha` / `resetRecaptcha`.

## Notes

- No more `createUserWithEmailAndPassword` — the Firebase Auth user is created by `confirmationResult.confirm`. Email/password is layered via `linkWithCredential`.
- `sendEmailVerification` failure is non-fatal; user can resend from the post-login banner.
- All Firebase Phone Auth interactions go through `src/lib/firebasePhoneAuth.ts` so error mapping and verifier lifecycle stay in one place.
