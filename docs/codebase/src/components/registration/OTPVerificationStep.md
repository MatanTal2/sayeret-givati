# OTPVerificationStep.tsx

**File:** `src/components/registration/OTPVerificationStep.tsx`
**Lines:** 257
**Status:** Active

## Purpose

OTP code entry step in the registration flow. Renders a 6-digit input that auto-submits when all 6 digits are entered. Calls `/api/auth/verify-otp` directly. Shows the masked phone number, validation error, backend error, and a resend button (resend is handled by the parent via `onResendOTP`).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `phoneNumber` | `string` | ✅ | Phone number to display (masked) and submit with OTP |
| `onVerifySuccess` | `() => void` | ❌ | Called after successful OTP verification |

## State

| State | Type | Purpose |
|-------|------|---------|
| `otpCode` | `string` | 6-digit code input |
| `validationError` | `string \| null` | Format validation error |
| `isValid` | `boolean` | Whether code format is valid |
| `backendError` | `string \| null` | API verification error |
| `isVerifying` | `boolean` | API call in progress |
| `hasAutoAttempted` | `boolean` | Prevents double auto-submit |
| `inputRef` | `RefObject<HTMLInputElement>` | Auto-focus |

## Notes

- Auto-submits when `otpCode.length === 6` and `isValid`. Uses `hasAutoAttempted` guard to prevent duplicate submissions.
- `console.log` in verification flow — remove for production.
