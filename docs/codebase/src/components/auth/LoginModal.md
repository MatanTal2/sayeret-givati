# LoginModal.tsx

**File:** `src/components/auth/LoginModal.tsx`
**Lines:** 272
**Status:** Active

## Purpose

Email/password login modal. Renders a form inside an overlay. On submission calls `AuthContext.login`. Displays feedback via `AuthContext.message`. Has a "switch to registration" link that calls `onSwitch`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Whether the modal is visible |
| `onClose` | `() => void` | ✅ | Close callback |
| `onSwitch` | `() => void` | ✅ | Switch to registration modal |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `{ email, password }` | Controlled form inputs |
| `showPassword` | `boolean` | Password show/hide toggle |
