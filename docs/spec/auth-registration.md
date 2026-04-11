# Feature: Authentication & Registration

## What Exists (Implemented)

A two-path identity system: **login** (Firebase Auth email/password + OTP phone verification) and **registration** (multi-step form that pre-checks against `authorized_personnel` before creating a Firebase Auth account).

Registration requires pre-authorization — an admin must add the soldier's military personal number to `authorized_personnel` before the soldier can register. On registration, the `authorized_personnel` record is marked `isRegistered: true` and a `users` document is created with the Firebase Auth UID as the document ID.

Session state is managed by `AuthContext`, which holds both the raw Firebase `User` and an `EnhancedAuthUser` (enriched with Firestore profile data).

OTP is used during registration (phone verification step) and potentially for login. OTP delivery is via Twilio SMS through Next.js API routes.

---

## User Stories

### Login
- As a registered user, I can log in with email and password.  
  **Status:** ✅ Implemented (`LoginModal.tsx`, `AuthContext`)
- As a user, I see a global login modal if I try to access a protected route while unauthenticated.  
  **Status:** ✅ Implemented (`AuthGuard.tsx`, `GlobalAuthModal.tsx`)
- As a user, I can log out from any screen.  
  **Status:** ✅ Implemented (via `AuthContext.logout`)
- As a user, my session persists across page reloads (Firebase Auth persistence).  
  **Status:** ✅ Implemented

### Registration
- As a new soldier, I can register only if my military personal number has been pre-authorized by an admin.  
  **Status:** ✅ Implemented — verified via `/api/auth/verify-military-id`
- As a new soldier, I go through a 5-step registration form: personal details → account details → military details → OTP phone verification → success.  
  **Status:** ✅ Implemented (`RegistrationForm.tsx` + 5 step components)
- As a new soldier, I receive a one-time SMS code to verify my phone number during registration.  
  **Status:** ✅ Implemented — via `/api/auth/send-otp` and `/api/auth/verify-otp`
- As a new soldier, registration creates both a Firebase Auth account and a Firestore user profile.  
  **Status:** ✅ Implemented (`/api/auth/register`, `userService.ts`)
- As a new soldier, after registration my `authorized_personnel` record is marked as registered.  
  **Status:** ✅ Implemented (`markPersonnelAsRegistered` in `userService.ts`)

### OTP
- As a user, OTP codes expire after a set time window.  
  **Status:** ✅ Implemented (`otpUtils.ts` — rate limited to 5 attempts/hour per phone)
- As a user, I can request a new OTP code if the previous one expired.  
  **Status:** ✅ Implemented (resend button in `OTPVerificationStep.tsx`)

### Registration Step Validation
- As a user, each registration step validates its fields before allowing me to proceed.  
  **Status:** ✅ Implemented (individual step validation in each step component)
- As a user, name validation accepts only Hebrew/English characters.  
  **Status:** 🔄 Partial — currently rejects `-` and `'` characters (known bug in `docs/bugs.md`)
- As a user, phone number input is validated for Israeli mobile format.  
  **Status:** 🔄 Partial — validation exists but normalization of separators is missing (known bug)

---

## In-Progress / TODO

- Phone normalization: strip non-digit characters, collapse multiple separators (known bug).
- Name validation: support `-` and `'` characters (known bug).
- Password reset flow: not implemented.
- Social / OAuth login: not planned.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/verify-military-id` | POST | Checks if military personal number exists in `authorized_personnel` |
| `/api/auth/send-otp` | POST | Generates OTP, stores in `otp_sessions`, sends SMS via Twilio |
| `/api/auth/verify-otp` | POST | Validates OTP code against `otp_sessions` |
| `/api/auth/register` | POST | Creates Firebase Auth user + Firestore `users` document |

## Screens / Routes Involved

| Screen | File |
|--------|------|
| Auth guard wrapper | `src/components/auth/AuthGuard.tsx` |
| Global modal provider | `src/components/auth/GlobalAuthModal.tsx` |
| Auth modal shell | `src/components/auth/AuthModal.tsx` |
| Modal state controller | `src/components/auth/AuthModalController.tsx` |
| Login form modal | `src/components/auth/LoginModal.tsx` |
| Unauthenticated prompt | `src/components/auth/LoginPrompt.tsx` |
| Registration modal wrapper | `src/components/registration/RegistrationModal.tsx` |
| Registration orchestrator | `src/components/registration/RegistrationForm.tsx` |
| Step 1: Personal details | `src/components/registration/PersonalDetailsStep.tsx` |
| Step 2: Account details | `src/components/registration/AccountDetailsStep.tsx` |
| Step 3: Military details | `src/components/registration/RegistrationDetailsStep.tsx` |
| Step 4: OTP verification | `src/components/registration/OTPVerificationStep.tsx` |
| Step 5: Success | `src/components/registration/RegistrationSuccessStep.tsx` |
| Step indicator | `src/components/registration/RegistrationStepDots.tsx` |
| OTP session management | `src/lib/otpUtils.ts` |
| User creation service | `src/lib/userService.ts` |
| Global auth state | `src/contexts/AuthContext.tsx` |
