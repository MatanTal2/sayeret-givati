# forgot-password/page.tsx

**File:** `src/app/forgot-password/page.tsx`
**Status:** Active

## Purpose

Standalone page for password reset. Verifies the email's `emailVerified` status server-side, then triggers a Firebase password reset email if eligible.

## Flow

1. User enters email and submits.
2. POST `/api/auth/check-email-verified` → `{ status: 'verified' | 'unverified' | 'not-found' | 'error' }`.
3. Branching:
   - `verified` → `sendPasswordReset(email)` (Firebase) → success message.
   - `unverified` → "verify email first" message.
   - `not-found` → generic success message (no account-existence reveal).
   - `error` → mapped Hebrew error from `mapFirebaseAuthError`.

## Notes

- All status strings come from `TEXT_CONSTANTS.AUTH`.
- The verify-first gate exists because users registered with email/password may have typo'd the email; a soft verification flow gives the password reset link a place to land before being trusted.
