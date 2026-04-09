# RegistrationHeader.tsx

**File:** `src/components/registration/RegistrationHeader.tsx`  
**Lines:** 41  
**Status:** Active

## Purpose

Stateless header bar for the registration modal. Renders the modal title centered, a close (×) button on the right, and a back-arrow button on the left. Designed for RTL layout — close is on the right (visually leading), back arrow is on the left.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onBack` | `() => void` | ✅ | Called when the back-arrow button is clicked |
| `onClose` | `() => void` | ✅ | Called when the × button is clicked |

## Notes

- Text is sourced from `TEXT_CONSTANTS.AUTH.REGISTER_TO_SYSTEM` and `TEXT_CONSTANTS.ARIA_LABELS.CLOSE_MODAL` / `TEXT_CONSTANTS.REGISTRATION_COMPONENTS.BACK_TO_LOGIN`.
- Uses `btn-press` and `focus-ring` from `@layer components`.
- No state — pure display component.
