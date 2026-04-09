# RegistrationFooter.tsx

**File:** `src/components/registration/RegistrationFooter.tsx`  
**Lines:** 19  
**Status:** Active

## Purpose

Stateless footer bar for the registration modal. Optionally renders a registration note (e.g. "You must be pre-authorized") and always renders the company name. Separated from content to keep the modal structure modular.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `showRegistrationNote` | `boolean` | ❌ | `false` | Show `TEXT_CONSTANTS.AUTH.REGISTRATION_NOTE` above company name |

## Notes

- Pure display component, no state.
- Both strings come from `TEXT_CONSTANTS`.
