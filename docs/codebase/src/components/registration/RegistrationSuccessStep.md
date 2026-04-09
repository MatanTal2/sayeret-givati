# RegistrationSuccessStep.tsx

**File:** `src/components/registration/RegistrationSuccessStep.tsx`  
**Lines:** 56  
**Status:** Active (TODO pending)

## Purpose

Final step of the registration flow. Shows a green success checkmark icon and a success message, then a "Continue to System" button. Calls `onContinue` when the button is clicked. Currently logs a TODO for the redirect.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onContinue` | `() => void` | ❌ | Called when the user clicks "Continue to System" |

## Known Issues / TODO

- `console.log('TODO: redirect to home page')` in `handleContinue` — actual navigation not implemented here; the parent (`GlobalAuthModal`) handles the reload after success.

## Notes

- No state — the only logic is the `handleContinue` wrapper that logs then calls `onContinue`.
- Uses `success-*` color tokens for the icon gradient and submit button.
- `onContinue` is optional; if not provided, the button still renders but does nothing beyond the console log.
