# RegistrationModal.tsx

**File:** `src/components/registration/RegistrationModal.tsx`
**Lines:** 95
**Status:** Active

## Purpose

Shell modal for the multi-step registration flow. Manages the overall step state and personal number value at the top level. Composes `RegistrationHeader`, `RegistrationStepDots`, `RegistrationForm`, and `RegistrationFooter`. Handles backward navigation between steps.

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
