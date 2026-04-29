# PersonalDetailsStep.tsx

**File:** `src/components/registration/PersonalDetailsStep.tsx`
**Lines:** 212
**Status:** Active

## Purpose

Registration step 3 (after OTP). Collects first name, last name, gender, and birthdate. Pre-fills first/last name from the `authorized_personnel` record (passed as props). Validates in real-time using `validateHebrewName`, `validateGender`, `validateBirthdate`.

## Layout notes

Gender (Headless UI Listbox) and birthdate (`<input type="date">`) sit side-by-side in a 2-col grid. Both controls are pinned to `h-10 border-2 rounded-lg px-3 text-sm` so the Listbox button and the native date input render identical boxes — the Select uses `!`-prefixed Tailwind classes to override the `input-base` `@layer components` defaults (border-1, rounded-xl, px-4) since `cn()` is not tailwind-merge.

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
