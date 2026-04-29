# RegistrationModal.tsx

**File:** `src/components/registration/RegistrationModal.tsx`
**Status:** Active

## Purpose

Shell modal for the multi-step registration flow. Manages the overall step state and personal number value at the top level. Composes `RegistrationHeader`, `RegistrationStepDots`, `RegistrationForm`, and `RegistrationFooter`. Handles backward navigation between steps.

## Orphan Auth user cleanup

After phone OTP succeeds the Firebase Auth user already exists, but the Firestore profile is only created on a successful `/api/auth/register` call. If the user closes the modal, switches to login, or navigates away before that point, the modal calls `deleteCurrentUser()` from `@/lib/firebasePhoneAuth` to remove the orphan account. If Firebase rejects the delete with `auth/requires-recent-login` (sign-in older than the recent-login window), the modal falls back to `signOutCurrentUser()`. `AuthContext` will then refuse to authenticate the orphan on the next page load.

A `registrationCompleteRef` is set on the success step to skip cleanup. The modal also sets/clears the `registrationInProgress` sessionStorage flag (via `@/lib/registrationFlowFlag`) so `AuthContext.onAuthStateChanged` does not race the in-flight registration and sign the user out prematurely.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close modal |
| `onSwitch` | `() => void` | ✅ | Switch to login modal |
| `onRegistrationSuccess` | `() => void` | ❌ | Called after registration completes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `personalNumber` | `string` | Military personal number (shared across steps) |
| `currentStep` | `RegistrationStep` | Active step: `'personal-number' \| 'otp' \| 'personal' \| 'account' \| 'success'` |
