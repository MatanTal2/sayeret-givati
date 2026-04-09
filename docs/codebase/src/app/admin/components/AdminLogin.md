# AdminLogin.tsx

**File:** `src/app/admin/components/AdminLogin.tsx`
**Lines:** 127
**Status:** Active

## Purpose

Admin login form. Renders an email + password form and calls `useAdminAuth().login()`. English-language UI (part of the LTR admin panel). Styled with dark mode classes.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLoginSuccess` | `() => void` | ✅ | Called after successful login |

## State

| State | Type | Purpose |
|-------|------|---------|
| `email` | `string` | Controlled email input |
| `password` | `string` | Controlled password input |
