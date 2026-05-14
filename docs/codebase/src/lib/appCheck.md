# appCheck.ts

**File:** `src/lib/appCheck.ts`
**Status:** Active (PR-C follow-up)

## Purpose

Initialize Firebase App Check on the client. App Check attaches a per-request reCAPTCHA v3 attestation token to every Firebase SDK call — Firestore, Storage, Phone Auth — and the Firebase backend rejects unattested requests. Mitigates the SMS-cost amplification vector the Council flagged on PR-C (an authenticated attacker burning the project's Phone Auth quota with garbage numbers).

## Init contract

`ensureAppCheckInitialized()` runs once per page load, idempotent. SSR-safe: no-ops on the server side. Fires only when `window` is defined AND `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set.

If the env var is missing, the function logs once and returns `null`. The app keeps working — Firebase calls just travel without an attestation token until the operator provisions a site key. This lets the codebase ship App Check incrementally without breaking any dev environment that hasn't been provisioned.

**Log level depends on environment.** Production / preview builds emit a multi-line `console.warn` so the missing key is loud. `NODE_ENV === 'development'` emits a single-line `console.info` instead, because dev workstations are intentionally unprovisioned (bug #19 — the loud warn drowned out other dev-time signals on every `/management` reload).

## Wired from `firebase.ts`

```ts
if (typeof window !== 'undefined') {
  ensureAppCheckInitialized();
}
```

The guard is belt-and-braces — the function already SSR-skips on its own — but pulling the call behind a `window` check keeps the App Check bundle out of the Next.js server build.

## Debug mode

For local dev / Storybook / Playwright, set `NEXT_PUBLIC_APP_CHECK_DEBUG=true` in `.env.local`. The init sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` BEFORE `initializeAppCheck`, which causes the SDK to print a debug token to the console on first run. Paste that token into Firebase Console → App Check → Debug tokens to whitelist your dev workstation. Production builds skip this branch (`NODE_ENV === 'production'`).

## Provider choice

reCAPTCHA v3 (free tier) instead of reCAPTCHA Enterprise. Enterprise costs money and adds an extra Google Cloud setup step — defer until production traffic actually warrants the upgraded risk scoring. Swap by replacing `ReCaptchaV3Provider` with `ReCaptchaEnterpriseProvider` in `appCheck.ts` and provisioning the new key.

## Test mock

`src/lib/__mocks__/firebase.ts` exports a `jest.fn()` stub for `initializeAppCheck` and a no-op `ReCaptchaV3Provider` class so tests that import anywhere through `firebase.ts` don't try to instantiate a real reCAPTCHA at module load time.
