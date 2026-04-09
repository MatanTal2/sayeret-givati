# RegistrationDetailsStep.tsx

**File:** `src/components/registration/RegistrationDetailsStep.tsx`  
**Lines:** 360 ⚠️ LONG  
**Status:** Active

## Purpose

An older/alternate registration step (not the same as `AccountDetailsStep`) that collects email, password, gender, birthdate, and consent in a single form. Displays pre-filled read-only `firstName` and `lastName` fields from prior steps. Validates all fields in real-time. Shows a privacy policy modal via `ConfirmationModal`. The `console.log` inside `handleSubmit` confirms Firebase integration is still a TODO.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `firstName` | `string` | ✅ | Pre-filled, read-only display |
| `lastName` | `string` | ✅ | Pre-filled, read-only display |
| `phoneNumber` | `string` | ✅ | Accepted but unused (`eslint-disable` comment present) |
| `onSubmit` | `(data: RegistrationData) => void` | ❌ | Step completion callback |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `RegistrationData` | Controlled form: email, password, gender, birthdate, consent |
| `validationErrors` | `ValidationErrors` | Per-field error messages |
| `showPassword` | `boolean` | Password show/hide toggle |
| `isFormValid` | `boolean` | All fields valid — gates submit button |
| `showPolicyModal` | `boolean` | Privacy policy `ConfirmationModal` visibility |

## Local Types

```typescript
interface RegistrationData {
  email: string;
  password: string;
  gender: string;
  birthdate: string;
  consent: boolean;
}

interface ValidationErrors {
  email: string | null;
  password: string | null;
  gender: string | null;
  birthdate: string | null;
  consent: string | null;
}
```

## Known Issues / TODO

- `console.log('TODO: register user in Firebase Auth and Firestore')` in `handleSubmit` — Firebase call not implemented.
- `phoneNumber` prop is accepted but explicitly marked unused (`eslint-disable @typescript-eslint/no-unused-vars`).
- Collects gender and birthdate which `AccountDetailsStep` does not — unclear which step is actually wired into `RegistrationForm`. Possible dead component.
- Inline Hebrew string `"בחר מין"` and `"פרטים אישיים"` not from `TEXT_CONSTANTS`.

## Notes

- This component overlaps significantly with `AccountDetailsStep.tsx` — both collect email, password, and consent with the same validation functions. One of them may be unused. See `docs/duplications.md`.
- Uses `ConfirmationModal` for privacy policy display (same pattern as `AccountDetailsStep`).
- `info-*` color tokens used for focus rings and submit button gradient (vs `primary-*` in `AccountDetailsStep`).
