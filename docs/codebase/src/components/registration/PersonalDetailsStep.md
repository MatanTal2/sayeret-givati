# PersonalDetailsStep.tsx

**File:** `src/components/registration/PersonalDetailsStep.tsx`
**Lines:** 212
**Status:** Active

## Purpose

Registration step 3 (after OTP). Collects first name, last name, gender, and birthdate. Pre-fills first/last name from the `authorized_personnel` record (passed as props). Validates in real-time using `validateHebrewName`, `validateGender`, `validateBirthdate`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `firstName` | `string` | ✅ | Pre-filled from authorized_personnel |
| `lastName` | `string` | ✅ | Pre-filled from authorized_personnel |
| `gender` | `string` | ❌ | Initial gender value |
| `birthdate` | `string` | ❌ | Initial birthdate value |
| `onSubmit` | `(data: PersonalDetailsData) => void` | ✅ | Step completion callback |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `PersonalDetailsData` | Controlled form fields |
| `validationErrors` | `PersonalDetailsValidationErrors` | Per-field error messages |
| `isFormValid` | `boolean` | Whether all fields pass validation |
