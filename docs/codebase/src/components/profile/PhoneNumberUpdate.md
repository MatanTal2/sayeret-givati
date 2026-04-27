# PhoneNumberUpdate.tsx

**File:** `src/components/profile/PhoneNumberUpdate.tsx`  
**Lines:** 365 ⚠️ LONG  
**Status:** Active (mock OTP)
**Tests:** `src/components/profile/__tests__/PhoneNumberUpdate.test.tsx`

## Purpose

Phone number update workflow with OTP verification. Steps: (1) show current number with edit button, (2) enter new number, (3) send OTP (mock), (4) verify OTP code, (5) update number. Includes countdown timer for resend.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentPhoneNumber` | `string` | ❌ | Current phone number display |
| `onPhoneUpdate` | `(newPhone: string) => void` | ✅ | Called after successful verification |
| `className` | `string` | ❌ | Additional classes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `isEditing` | `boolean` | Edit mode active |
| `newPhoneNumber` | `string` | New number input |
| `otpCode` | `string` | OTP input |
| `updateState` | `object` | `{ isUpdating, otpSent, otpVerified, error, success, countdown }` |

## Display formatting

`formatPhoneDisplay()` accepts numbers in international (`+972...`) or local (`0XX...`) format and renders them as `0XX-XXX-XXXX`. The leading `0` is preserved when stripping the `972` country code.

## Known Issues / TODO

- Mock OTP/SMS services — not integrated with Twilio or real backend.
- 365 lines — should be split.
- Extensive inline Hebrew text.
