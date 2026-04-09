# utils/validationUtils.ts

**File:** `src/utils/validationUtils.ts`  
**Lines:** 444 ⚠️ LONG  
**Status:** Active

## Purpose

Form validation utility class and phone formatting utilities. Provides validation functions for all registration and profile form fields.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `FormValidationUtils` | class (static) | 8 validation methods: `validateEmail`, `validatePassword`, `validateName`, `validatePersonalNumber`, `validateGender`, `validateBirthdate`, `validateConsent`, `validatePhoneNumber` |
| `PhoneUtils` | class (static) | 5 phone utilities: `formatPhoneNumber`, `normalizePhoneNumber`, `isValidIsraeliPhone`, `getPhoneType`, `stripNonDigits` |
| `validateEmail`, `validatePassword`, etc. | functions | Direct re-exports for convenience |
| `VALIDATION_PATTERNS` | object | Regex patterns |
| `VALIDATION_MESSAGES` | object | Hebrew error messages |

## Known Issues

- 444 lines — candidate for split.
- `VALIDATION_PATTERNS` partially duplicated with `src/constants/admin.ts`.
