# OTPVerificationStep.tsx

**File:** `src/components/registration/OTPVerificationStep.tsx`
**Status:** Active

## Purpose

OTP code entry step in the registration flow. Verifies a Firebase Phone Auth `ConfirmationResult` passed in from the parent. Auto-submits when 6 digits are entered. Resend is delegated to the parent (which owns the reCAPTCHA verifier).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `phoneNumber` | `string` | ✅ | Phone number for masked display |
| `confirmationResult` | `ConfirmationResult \| null` | ✅ | Firebase confirmation handle from `signInWithPhoneNumber` |
| `onVerifySuccess` | `() => void` | ❌ | Called after `confirmationResult.confirm(code)` succeeds |
| `onResendOtp` | `() => Promise<void>` | ❌ | Called when user clicks "resend"; parent re-runs reCAPTCHA + send |

## Flow

1. User types code (digits only, max 6).
2. On 6 valid digits, auto-calls `confirmPhoneOtp(confirmationResult, code)` from `src/lib/firebasePhoneAuth.ts`.
3. On success → `onVerifySuccess()`. The Firebase Auth user is now signed in with the phone credential.
4. Errors are mapped via `mapFirebaseAuthError` and shown in Hebrew.
5. Resend → calls `onResendOtp` and clears local state.

## Notes

- No fetch calls — all auth happens client-side via Firebase SDK.
- The component is purely presentational over the Firebase confirmation handle. Verifier and SMS send live in the parent `RegistrationForm`.
