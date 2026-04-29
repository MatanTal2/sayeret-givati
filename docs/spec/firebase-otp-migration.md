# Firebase Phone Auth Migration (Phase 1)

## Status

Implemented on branch `feat/firebase-otp-migration` (2026-04-28). Replaces Twilio SMS OTP with Firebase Phone Auth. Email + password remains the daily login method; phone OTP is used **only at registration** as the gate.

## Why

- Twilio free trial ending — billing imminent.
- App is already Firebase-native (Auth + Firestore + Admin SDK). Removes one external dependency, dashboard, and secret set.
- Firebase Phone Auth: 10K verifications/month free in IL (Tier 1). Sayeret-unit volume comfortably below.
- Email/password login costs nothing per use, so we keep it for daily login and use OTP only for one-time phone verification at registration.

## Auth model

```
Registration (one-time):
  1. Military ID → match authorized_personnel
  2. signInWithPhoneNumber(phone, recaptchaVerifier)   ← Firebase, no Twilio
  3. confirmationResult.confirm(code)                  ← creates Firebase Auth user (phone credential)
  4. Personal details (name/gender/birthdate)
  5. Account details (email + password)
  6. linkWithCredential(EmailAuthProvider.credential(email, password))  ← adds 2nd credential to SAME user
  7. sendEmailVerification()                           ← soft (non-blocking)
  8. POST /api/auth/register → writes Firestore profile via firebase-admin directly

Login (every time):
  - Email + password via signInWithEmailAndPassword
  - Phone OTP never used at login
```

The Firebase Auth user ends up with **two providers**: phone + password. Either could sign them in, but production UX uses email/password.

## Soft email verification

- A banner is shown for any signed-in user where `firebaseUser.emailVerified === false`. Banner offers a "resend verification" button and a "check again" button (calls `user.reload()`).
- Login is **not** blocked for unverified users.
- Password reset (`/forgot-password`) **is** blocked for unverified emails. Server checks via `getAdminAuth().getUserByEmail(email)`. Status: `verified` → send reset; `unverified` → show "verify first"; `not-found` → show generic success (no account-existence reveal).

## reCAPTCHA

Invisible reCAPTCHA v2, auto-provisioned by Firebase Phone Auth. Container div with id `firebase-recaptcha-container` is mounted by `RecaptchaContainer.tsx` inside `RegistrationForm` (always present so the verifier can attach before/after step changes). Verifier is reset before each `signInWithPhoneNumber` call so resend is supported.

## Files

### New
- `src/lib/firebasePhoneAuth.ts` — wrapper: `initRecaptcha`, `resetRecaptcha`, `sendPhoneOtp`, `confirmPhoneOtp`, `linkEmailPassword`, `sendVerificationEmail`, `sendPasswordReset`, `mapFirebaseAuthError`.
- `src/components/registration/RecaptchaContainer.tsx` — invisible reCAPTCHA host.
- `src/components/auth/EmailVerificationBanner.tsx` — sticky banner mounted in app layout.
- `src/app/forgot-password/page.tsx` — password reset page with verify-first gate.
- `src/app/api/auth/check-email-verified/route.ts` — admin SDK lookup for verified status.

### Modified
- `src/components/registration/RegistrationForm.tsx` — replaced `createUserWithEmailAndPassword` with `linkWithCredential` against the phone-auth user. Owns reCAPTCHA verifier.
- `src/components/registration/OTPVerificationStep.tsx` — uses `confirmationResult.confirm()`. Resend delegated to parent via `onResendOtp` prop.
- `src/contexts/AuthContext.tsx` — added `emailVerified`, `resendVerificationEmail`, `refreshEmailVerified`.
- `src/app/api/auth/register/route.ts` — accepts `emailVerified`, no longer requires `password`.
- `src/lib/userService.ts` — `RegistrationData` no longer has `password`; added optional `emailVerified`. `UserProfile` has optional `emailVerified`.
- `src/types/user.ts` — `EnhancedAuthUser.emailVerified?: boolean`.
- `src/lib/db/collections.ts` — removed `OTP_SESSIONS` and `OTP_RATE_LIMITS`.
- `src/lib/__mocks__/firebase.ts` — added phone-auth and Firestore primitive mocks.
- `jest.config.js` — added `firebase/storage` mapper.
- `src/app/layout.tsx` — mounted `EmailVerificationBanner`.
- `src/constants/text.ts` — new Hebrew strings (verification banner, link errors, forgot-password copy).
- `ENV_SETUP.md` — replaced Twilio block with Firebase Phone Auth note.

### Deleted
- `src/lib/twilioService.ts`
- `src/lib/otpUtils.ts`
- `src/lib/db/server/otpService.ts`
- `src/app/api/auth/send-otp/route.ts`
- `src/app/api/auth/verify-otp/route.ts`
- `src/scripts/testOTPFlow.ts`
- `src/lib/__tests__/otpFlow.test.ts`
- `docs/otp-implementation.md`, `docs/otp-step-by-step-guide.md`, `docs/otp-frontend-integration-complete.md`
- `docs/codebase/src/lib/twilioService.md`, `otpUtils.md`
- `docs/codebase/src/app/api/auth/send-otp/`, `verify-otp/`
- `twilio` npm dependency

## Firebase Console actions required (manual, one-time)

1. Authentication → Sign-in method → Phone → **Enable**.
2. Project → upgrade to Blaze plan if not already (Identity Platform requirement).
3. Authentication → Settings → Authorized domains → add `localhost`, `*.vercel.app`, prod domain.
4. Authentication → Phone → Phone numbers for testing → add a fixed test phone (e.g. `+972 50 123 4567` → `123456`) for local dev / CI.
5. Resolve open infra blocker: regenerate `GOOGLE_SERVICE_ACCOUNT_JSON` for `sayeret-givati-1983` (the existing key targets the wrong project). The `/api/auth/check-email-verified` endpoint uses Admin SDK `getUserByEmail`.

## Verification

1. `npm run dev` → register a user with the test phone configured in Firebase. Confirm SMS / fixed code accepted.
2. Firebase Auth dashboard shows the user with **both** phone and password providers.
3. Sign out, sign in with email + password — works without OTP.
4. Email verification banner appears after fresh registration. "Resend" works. After clicking the email link and pressing "check again", banner disappears.
5. `/forgot-password`:
   - Unverified email → "verify first" message.
   - Verified email → reset link sent.
   - Unknown email → generic success (no leak).
6. `npm run lint`, `npm test`, `npm run build` all green for the migration scope. Pre-existing test failures (CSS class mismatch, missing mocks in unrelated suites) are unchanged by this work.

## Phase 2 (separate plan)

- Add Google sign-in button on login + registration screens.
- Profile/settings page: link/unlink Google as a secondary provider.
- Military ID + phone OTP gate remains required for first-time registration via Google.
