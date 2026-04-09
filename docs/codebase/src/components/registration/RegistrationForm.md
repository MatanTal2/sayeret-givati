# RegistrationForm.tsx

**File:** `src/components/registration/RegistrationForm.tsx`
**Lines:** 412 ⚠️ LONG — split recommended
**Status:** Active

## Purpose

Step orchestrator for the registration flow. Renders the content area of each registration step based on `currentStep`. Owns the inter-step data state (phone number, first/last name, personal/account details) and coordinates the async operations: military ID verification → OTP send → OTP verify → personal details → account details → Firebase Auth creation → API register call → success.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `personalNumber` | `string` | ✅ | Military personal number (from parent) |
| `setPersonalNumber` | `(v: string) => void` | ✅ | Update personal number |
| `onSwitchToLogin` | `() => void` | ❌ | Switch to login modal |
| `onStepChange` | `(step) => void` | ❌ | Notify parent of step changes |
| `currentStep` | `RegistrationStep` | ✅ | Controlled step from parent |
| `onRegistrationSuccess` | `() => void` | ❌ | Called on successful completion |

## State

| State | Type | Purpose |
|-------|------|---------|
| `validationError` | `string \| null` | Personal number format error |
| `isValid` | `boolean` | Personal number passes validation |
| `isVerifying` | `boolean` | ID verification API call in progress |
| `userPhoneNumber` | `string` | Phone from OTP step (passed to account step) |
| `userFirstName` / `userLastName` | `string` | Name from authorized_personnel lookup |
| `isSendingOTP` | `boolean` | OTP send in progress |
| `otpSendError` | `string \| null` | OTP send failure message |
| `isSubmittingRegistration` | `boolean` | Final registration API call in progress |
| `personalDetailsData` | `PersonalDetailsData \| null` | Completed personal step data |
| `accountDetailsData` | `AccountDetailsData \| null` | Completed account step data |

## Firebase Operations

| Collection | Operation | Trigger |
|------------|-----------|---------|
| N/A | `createUserWithEmailAndPassword` | Account step completion (Firebase Auth, not Firestore) |

## Notes

- This component makes a direct Firebase Auth call (`createUserWithEmailAndPassword`) — one of very few places that does so outside a service/hook.
- After Firebase Auth account creation, calls `/api/auth/register` to create the Firestore user profile.
- At 412 lines, the async step handlers are candidates for extraction into a custom hook.
