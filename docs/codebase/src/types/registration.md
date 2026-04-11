# types/registration.ts

**File:** `src/types/registration.ts`  
**Lines:** 68  
**Status:** Active

## Purpose

User registration form and validation interfaces for the multi-step registration flow.

## Exports

- `PersonalDetailsData` — step 1: firstName, lastName, personalNumber
- `AccountDetailsData` — step 2: email, password, consent
- `CompleteRegistrationData` — combined registration data
- `PersonalDetailsValidationErrors` / `AccountDetailsValidationErrors` — per-field error types
