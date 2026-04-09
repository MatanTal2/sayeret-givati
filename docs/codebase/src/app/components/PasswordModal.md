# PasswordModal.tsx

**File:** `src/app/components/PasswordModal.tsx`
**Lines:** 95
**Status:** Active

## Purpose

Modal dialog for password verification before submitting soldier status updates to Google Sheets. Renders a password input with show/hide toggle, a validation error message, and submit/cancel buttons.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `password` | `string` | ✅ | Controlled password input value |
| `passwordError` | `string` | ✅ | Error message to display |
| `showPassword` | `boolean` | ✅ | Whether to show password in plain text |
| `isUpdatingServer` | `boolean` | ✅ | Loading state for submit button |
| `onPasswordChange` | `(value: string) => void` | ✅ | Input change handler |
| `onToggleShow` | `() => void` | ✅ | Toggle show/hide |
| `onSubmit` | `() => void` | ✅ | Submit callback |
| `onCancel` | `() => void` | ✅ | Cancel callback |
