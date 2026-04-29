import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  EmailAuthProvider,
  linkWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  type ConfirmationResult,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TEXT_CONSTANTS } from '@/constants/text';

let cachedVerifier: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
  if (cachedVerifier) {
    return cachedVerifier;
  }
  cachedVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  return cachedVerifier;
}

export function resetRecaptcha(): void {
  if (cachedVerifier) {
    cachedVerifier.clear();
    cachedVerifier = null;
  }
}

export async function sendPhoneOtp(
  phoneE164: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string
): Promise<UserCredential> {
  return confirmation.confirm(code);
}

export async function linkEmailPassword(
  user: User,
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = EmailAuthProvider.credential(email, password);
  return linkWithCredential(user, credential);
}

export async function sendVerificationEmail(user: User): Promise<void> {
  return sendEmailVerification(user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? (error as { code: string }).code
      : '';
  switch (code) {
    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return TEXT_CONSTANTS.AUTH.OTP_INVALID_PHONE_FORMAT;
    case 'auth/invalid-verification-code':
    case 'auth/missing-verification-code':
    case 'auth/code-expired':
    case 'auth/invalid-verification-id':
    case 'auth/missing-verification-id':
      return TEXT_CONSTANTS.AUTH.OTP_WRONG_CODE;
    case 'auth/captcha-check-failed':
      return TEXT_CONSTANTS.AUTH.OTP_CAPTCHA_FAILED;
    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return TEXT_CONSTANTS.AUTH.OTP_RATE_LIMITED_FALLBACK;
    case 'auth/network-request-failed':
      return TEXT_CONSTANTS.AUTH.OTP_CONNECTION_ERROR;
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return TEXT_CONSTANTS.AUTH.EMAIL_ALREADY_LINKED;
    case 'auth/provider-already-linked':
      return TEXT_CONSTANTS.AUTH.PROVIDER_ALREADY_LINKED;
    case 'auth/weak-password':
      return TEXT_CONSTANTS.AUTH.WEAK_PASSWORD;
    case 'auth/invalid-email':
      return TEXT_CONSTANTS.AUTH.INVALID_EMAIL;
    default:
      return TEXT_CONSTANTS.AUTH.OTP_INTERNAL_ERROR;
  }
}
