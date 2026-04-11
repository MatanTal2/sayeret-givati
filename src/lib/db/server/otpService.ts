/**
 * Server-side OTP Service (firebase-admin)
 * Handles OTP session management and rate limiting.
 * Only called from API routes — never from client code.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const OTP_EXPIRY_MINUTES = 5;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create OTP session in Firestore
 */
export async function createOTPSession(phoneNumber: string, otpCode: string): Promise<void> {
  const db = getAdminDb();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.collection(COLLECTIONS.OTP_SESSIONS).doc(phoneNumber).set({
    phoneNumber,
    otpCode,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    verified: false,
  });
}

/**
 * Verify OTP code against stored session
 */
export async function verifyOTPCode(
  phoneNumber: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(COLLECTIONS.OTP_SESSIONS).doc(phoneNumber);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return { success: false, error: 'No OTP session found for this phone number' };
    }

    const session = docSnapshot.data()!;

    if (session.verified) {
      return { success: false, error: 'OTP code has already been used' };
    }

    const expiresAt = (session.expiresAt as Timestamp).toDate();
    if (new Date() > expiresAt) {
      await docRef.delete();
      return { success: false, error: 'OTP code has expired' };
    }

    if (session.otpCode !== inputCode) {
      return { success: false, error: 'Invalid OTP code' };
    }

    // Verified — delete session
    await docRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Internal error during OTP verification' };
  }
}

/**
 * Check and update rate limiting for phone number
 */
export async function checkRateLimit(phoneNumber: string): Promise<{
  allowed: boolean;
  attemptsRemaining?: number;
  resetTime?: Date;
}> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(COLLECTIONS.OTP_RATE_LIMITS).doc(phoneNumber);
    const docSnapshot = await docRef.get();

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

    if (!docSnapshot.exists) {
      await docRef.set({
        phoneNumber,
        attempts: 1,
        firstAttemptAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
    }

    const data = docSnapshot.data()!;
    const firstAttemptTime = (data.firstAttemptAt as Timestamp).toDate();

    if (firstAttemptTime < windowStart) {
      // Reset window
      await docRef.set({
        phoneNumber,
        attempts: 1,
        firstAttemptAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - 1 };
    }

    if (data.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      const resetTime = new Date(firstAttemptTime.getTime() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
      return { allowed: false, attemptsRemaining: 0, resetTime };
    }

    // Increment
    const newAttempts = data.attempts + 1;
    await docRef.set({
      ...data,
      attempts: newAttempts,
      lastAttemptAt: FieldValue.serverTimestamp(),
    });

    return { allowed: true, attemptsRemaining: RATE_LIMIT_MAX_ATTEMPTS - newAttempts };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, attemptsRemaining: 0 };
  }
}

/**
 * Clean up expired OTP sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTIONS.OTP_SESSIONS).get();
    const now = new Date();
    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      const expiresAt = (doc.data().expiresAt as Timestamp).toDate();
      if (now > expiresAt) {
        await doc.ref.delete();
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}
