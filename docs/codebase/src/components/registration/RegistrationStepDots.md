# RegistrationStepDots.tsx

**File:** `src/components/registration/RegistrationStepDots.tsx`
**Lines:** 139
**Status:** Active

## Purpose

Visual step indicator for the registration flow. Shows 4 numbered dots (ID verification, OTP, personal details, account details) — the success screen has no dot. Active step is highlighted; completed steps show a checkmark.

## Exports / Public API

- `RegistrationStep` (type) — `'personal-number' | 'otp' | 'personal' | 'account' | 'success'`
- `default RegistrationStepDots` — component

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentStep` | `RegistrationStep` | ✅ | Active step |
| `className` | `string` | ❌ | Additional CSS classes |
