# AccountDetailsStep.tsx

**File:** `src/components/registration/AccountDetailsStep.tsx`
**Lines:** 278
**Status:** Active

## Purpose

Registration step 4. Collects email, password, and privacy policy consent. Validates in real-time using `validateEmail`, `validatePassword`, `validateConsent`. Shows a password strength tooltip and a privacy policy modal on consent click.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `email` | `string` | ❌ | Initial email |
| `password` | `string` | ❌ | Initial password |
| `consent` | `boolean` | ❌ | Initial consent value |
| `onSubmit` | `(data: AccountDetailsData) => void` | ✅ | Step completion callback |
| `isSubmitting` | `boolean` | ❌ | Loading state while Firebase creates account |
| `submitError` | `string \| null` | ❌ | Error from `linkEmailPassword` / `/api/auth/register`; rendered above the submit button when not submitting |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `AccountDetailsData` | Controlled form fields |
| `validationErrors` | `AccountDetailsValidationErrors` | Per-field error messages |
| `showPassword` | `boolean` | Password show/hide |
| `isFormValid` | `boolean` | All fields valid |
| `showPasswordTooltip` | `boolean` | Password strength hint visibility |
| `showPolicyModal` | `boolean` | Privacy policy modal |
