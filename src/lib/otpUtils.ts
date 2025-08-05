import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * OTP Session interface for Firestore storage
 */
export interface OTPSession {
  phoneNumber: string;
  otpCode: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  verified: boolean;
}

/**
 * Rate limiting session interface
 */
export interface RateLimitSession {
  phoneNumber: string;
  attempts: number;
  firstAttemptAt: Timestamp;
  lastAttemptAt: Timestamp;
}

/**
 * OTP Management utilities
 */
export class OTPManager {
  private static readonly OTP_COLLECTION = 'otp_sessions';
  private static readonly RATE_LIMIT_COLLECTION = 'otp_rate_limits';
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly RATE_LIMIT_MAX_ATTEMPTS = 5;
  private static readonly RATE_LIMIT_WINDOW_HOURS = 1;

  /**
   * Generate a random 6-digit OTP code as string
   */
  static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create OTP session in Firestore
   */
  static async createOTPSession(phoneNumber: string, otpCode: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    const otpSession: Omit<OTPSession, 'createdAt' | 'expiresAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      expiresAt: Timestamp;
    } = {
      phoneNumber,
      otpCode,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false
    };

    // Use phone number as document ID for easy lookup
    const docRef = doc(db, this.OTP_COLLECTION, phoneNumber);
    await setDoc(docRef, otpSession);
  }

  /**
   * Verify OTP code against stored session
   */
  static async verifyOTPCode(phoneNumber: string, inputCode: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const docRef = doc(db, this.OTP_COLLECTION, phoneNumber);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return {
          success: false,
          error: 'No OTP session found for this phone number'
        };
      }

      const session = docSnapshot.data() as OTPSession;

      // Check if already verified
      if (session.verified) {
        return {
          success: false,
          error: 'OTP code has already been used'
        };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = session.expiresAt.toDate();
      if (now > expiresAt) {
        // Clean up expired session
        await deleteDoc(docRef);
        return {
          success: false,
          error: 'OTP code has expired'
        };
      }

      // Check if code matches
      if (session.otpCode !== inputCode) {
        return {
          success: false,
          error: 'Invalid OTP code'
        };
      }

      // Mark as verified and delete session
      await deleteDoc(docRef);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Internal error during OTP verification'
      };
    }
  }

  /**
   * Check and update rate limiting for phone number
   */
  static async checkRateLimit(phoneNumber: string): Promise<{
    allowed: boolean;
    attemptsRemaining?: number;
    resetTime?: Date;
  }> {
    try {
      const docRef = doc(db, this.RATE_LIMIT_COLLECTION, phoneNumber);
      const docSnapshot = await getDoc(docRef);

      const now = new Date();
      const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

      if (!docSnapshot.exists()) {
        // First attempt - create new rate limit session
        const rateLimitSession: Omit<RateLimitSession, 'firstAttemptAt' | 'lastAttemptAt'> & {
          firstAttemptAt: ReturnType<typeof serverTimestamp>;
          lastAttemptAt: ReturnType<typeof serverTimestamp>;
        } = {
          phoneNumber,
          attempts: 1,
          firstAttemptAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp()
        };

        await setDoc(docRef, rateLimitSession);

        return {
          allowed: true,
          attemptsRemaining: this.RATE_LIMIT_MAX_ATTEMPTS - 1
        };
      }

      const rateLimitData = docSnapshot.data() as RateLimitSession;
      const firstAttemptTime = rateLimitData.firstAttemptAt.toDate();

      // Check if we're outside the rate limit window
      if (firstAttemptTime < windowStart) {
        // Reset rate limit window
        const newRateLimitSession: Omit<RateLimitSession, 'firstAttemptAt' | 'lastAttemptAt'> & {
          firstAttemptAt: ReturnType<typeof serverTimestamp>;
          lastAttemptAt: ReturnType<typeof serverTimestamp>;
        } = {
          phoneNumber,
          attempts: 1,
          firstAttemptAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp()
        };

        await setDoc(docRef, newRateLimitSession);

        return {
          allowed: true,
          attemptsRemaining: this.RATE_LIMIT_MAX_ATTEMPTS - 1
        };
      }

      // Check if we've exceeded the rate limit
      if (rateLimitData.attempts >= this.RATE_LIMIT_MAX_ATTEMPTS) {
        const resetTime = new Date(firstAttemptTime.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
        return {
          allowed: false,
          attemptsRemaining: 0,
          resetTime
        };
      }

      // Increment attempt count
      const updatedRateLimitSession: Omit<RateLimitSession, 'lastAttemptAt'> & {
        lastAttemptAt: ReturnType<typeof serverTimestamp>;
      } = {
        ...rateLimitData,
        attempts: rateLimitData.attempts + 1,
        lastAttemptAt: serverTimestamp()
      };

      await setDoc(docRef, updatedRateLimitSession);

      return {
        allowed: true,
        attemptsRemaining: this.RATE_LIMIT_MAX_ATTEMPTS - updatedRateLimitSession.attempts
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      // In case of error, allow the request but log the issue
      return {
        allowed: true,
        attemptsRemaining: 0
      };
    }
  }

  /**
   * Clean up expired OTP sessions (utility function for maintenance)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();
      const otpQuery = query(collection(db, this.OTP_COLLECTION));
      const querySnapshot = await getDocs(otpQuery);

      let deletedCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        const session = docSnapshot.data() as OTPSession;
        const expiresAt = session.expiresAt.toDate();

        if (now > expiresAt) {
          await deleteDoc(docSnapshot.ref);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }
}