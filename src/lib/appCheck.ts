/**
 * Firebase App Check initialization (PR-C follow-up).
 *
 * App Check attaches a per-request attestation token to every Firebase
 * SDK call (Firestore, Storage, Functions). The Firebase backend rejects
 * requests without a valid token, defanging the SMS-cost amplification
 * vector the Council flagged on Phone Auth — an attacker stuffing
 * `verifyPhoneNumber` against the public reCAPTCHA can still pass the
 * invisible captcha, but App Check rejects the call before it reaches
 * Phone Auth's quota.
 *
 * Provider: reCAPTCHA v3 (free tier). reCAPTCHA Enterprise is the
 * recommended upgrade for production but costs money — toggle by
 * swapping the provider once a site key is provisioned in Cloud Console.
 *
 * SSR-safe: this module no-ops on the server side. The init only fires
 * when `window` is defined AND `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set.
 * If the env var is missing the function logs once and returns — no
 * thrown error, no broken client builds — which lets the codebase ship
 * App Check incrementally without forcing every dev environment to
 * provision a key first.
 */
import { getApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';

let cachedAppCheck: AppCheck | null = null;
let warnedMissingKey = false;

/**
 * Initialize App Check on first call. Idempotent — subsequent calls
 * return the cached instance. Must run in a browser context; throws
 * if invoked from the server.
 */
export function ensureAppCheckInitialized(): AppCheck | null {
  if (typeof window === 'undefined') return null;
  if (cachedAppCheck) return cachedAppCheck;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    if (!warnedMissingKey) {
      console.warn(
        '[appCheck] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set — App Check is disabled. ' +
          'Phone Auth and Firestore traffic will not carry an attestation token. ' +
          'See ENV_SETUP.md for the provisioning steps.',
      );
      warnedMissingKey = true;
    }
    return null;
  }

  // Debug provider for local dev: setting
  // `FIREBASE_APPCHECK_DEBUG_TOKEN=true` on `self` BEFORE `initializeAppCheck`
  // tells the SDK to print a debug token to the console. The operator
  // pastes it into Firebase Console → App Check → Debug tokens.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_APP_CHECK_DEBUG === 'true') {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  cachedAppCheck = initializeAppCheck(getApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return cachedAppCheck;
}
