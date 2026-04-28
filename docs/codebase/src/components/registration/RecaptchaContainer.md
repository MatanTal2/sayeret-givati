# RecaptchaContainer.tsx

**File:** `src/components/registration/RecaptchaContainer.tsx`
**Status:** Active

## Purpose

Renders the invisible reCAPTCHA host `<div>` that Firebase Phone Auth attaches to. Used by `RegistrationForm` so the container is in the DOM before `firebasePhoneAuth.initRecaptcha` runs.

## Exports

| Export | Description |
|--------|-------------|
| `RECAPTCHA_CONTAINER_ID` | Stable id (`firebase-recaptcha-container`) referenced by `initRecaptcha`. |
| `default` | React component that renders `<div id={RECAPTCHA_CONTAINER_ID} />`. |
