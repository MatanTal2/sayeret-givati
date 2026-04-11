# AuthModalController.tsx

**File:** `src/components/auth/AuthModalController.tsx`
**Lines:** 58
**Status:** Active

## Purpose

Controls which modal (login or registration) is currently visible and handles switching between them. Only one modal renders at a time. Resets to `initialModal` whenever `isOpen` toggles.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | ✅ | — | Overall modal visibility |
| `onClose` | `() => void` | ✅ | — | Close callback |
| `initialModal` | `'login' \| 'registration'` | ❌ | `'login'` | Which modal to show first |
| `onRegistrationSuccess` | `() => void` | ❌ | — | Called after successful registration |

## State

| State | Type | Purpose |
|-------|------|---------|
| `currentModal` | `'login' \| 'registration' \| null` | Active modal |
