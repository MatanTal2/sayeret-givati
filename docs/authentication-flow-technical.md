# 🔐 Authentication Flow - Technical Implementation

## מפרט טכני תהליך אימות - סיירת גבעתי

**תאריך יצירה:** ינואר 2025  
**סטטוס:** מפרט טכני 🛠️  
**גרסה:** 1.0

---

## 🎯 סקירה טכנית

מסמך זה מפרט את הישג הטכני המלא של מערכת האימות, כולל API endpoints, מבני נתונים, אלגוריתמי אבטחה ותהליכי אינטגרציה.

---

## 🏗️ ארכיטקטורת המערכת

### Components Overview

```ascii
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  RegistrationWizard │ OTPInput │ ValidationForms │ AuthHooks │
├─────────────────────────────────────────────────────────────┤
│                    API Routes (/api/auth)                  │
├─────────────────────────────────────────────────────────────┤
│  /verify-military-id │ /send-otp │ /verify-otp │ /create-user │
├─────────────────────────────────────────────────────────────┤
│                    Firebase Services                       │
├─────────────────────────────────────────────────────────────┤
│        Auth (Phone)  │   Firestore   │   Cloud Functions   │
├─────────────────────────────────────────────────────────────┤
│              Security Layer (Encryption/Hashing)           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant FB as Firebase Auth
    participant FS as Firestore
    participant S as Security Utils

    U->>F: Submit Registration Form
    F->>A: POST /api/auth/verify-military-id
    A->>S: Hash Military ID
    A->>FS: Query authorized_personnel
    A->>F: Return verification result
    
    F->>A: POST /api/auth/send-otp
    A->>FB: Send SMS via Firebase Auth
    A->>F: Return verification ID
    
    U->>F: Enter OTP Code
    F->>A: POST /api/auth/verify-otp
    A->>FB: Verify OTP with Firebase
    A->>FS: Create user profile
    A->>F: Return auth token & user data
```

---

## 🌐 API Specifications

### Base Configuration

```typescript
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://sayeret-givati.vercel.app',
  AUTH_PREFIX: '/api/auth',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10 // per window
  }
};
```

### 1. Military ID Verification

#### `POST /api/auth/verify-military-id`

**Purpose**: Verify military personal number against authorized personnel list

**Request Body**:

```typescript
interface MilitaryIdRequest {
  militaryPersonalNumber: string;  // 7-8 digits
  firstName: string;              // Hebrew only
  lastName: string;               // Hebrew only
}
```

**Response**:

```typescript
interface MilitaryIdResponse {
  success: boolean;
  data?: {
    authorized: boolean;
    matchedPersonnel: {
      rank: string;
      phoneNumber: string; // Pre-registered phone
    };
  };
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}
```

**Implementation**:

```typescript
// pages/api/auth/verify-military-id.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { SecurityUtils } from '@/lib/adminUtils';
import { AdminFirestoreService } from '@/lib/adminUtils';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MilitaryIdResponse>
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(req, res);
  if (!rateLimitResult.success) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'יותר מדי ניסיונות, נסה שנית מאוחר יותר'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
  }

  try {
    const { militaryPersonalNumber, firstName, lastName } = req.body;

    // Input validation
    const validation = validateMilitaryIdRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors[0],
          field: validation.field
        }
      });
    }

    // Hash the military ID
    const { hash, salt } = await SecurityUtils.hashMilitaryId(militaryPersonalNumber);

    // Query authorized personnel
    const authorizedPersonnel = await AdminFirestoreService
      .findAuthorizedPersonnelByHash(hash, firstName, lastName);

    if (!authorizedPersonnel) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_PERSONNEL',
          message: 'פרטים לא נמצאו ברשימת המאושרים'
        }
      });
    }

    // Check if already registered
    const existingUser = await AdminFirestoreService
      .findUserByMilitaryId(hash);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_REGISTERED',
          message: 'משתמש זה כבר רשום במערכת'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        authorized: true,
        matchedPersonnel: {
          rank: authorizedPersonnel.rank,
          phoneNumber: authorizedPersonnel.phoneNumber
        }
      }
    });

  } catch (error) {
    console.error('Military ID verification error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'שגיאה פנימית במערכת'
      }
    });
  }
}

function validateMilitaryIdRequest(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data.militaryPersonalNumber || !/^[0-9]{7,8}$/.test(data.militaryPersonalNumber)) {
    errors.push('מספר אישי חייב להכיל 7-8 ספרות');
  }
  
  if (!data.firstName || !/^[\u0590-\u05FF\s]{2,20}$/.test(data.firstName)) {
    errors.push('שם פרטי חייב להכיל 2-20 תווים בעברית');
  }
  
  if (!data.lastName || !/^[\u0590-\u05FF\s]{2,20}$/.test(data.lastName)) {
    errors.push('שם משפחה חייב להכיל 2-20 תווים בעברית');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    field: errors.length > 0 ? Object.keys(data)[0] : undefined
  };
}
```

### 2. OTP Send

#### `POST /api/auth/send-otp`

**Purpose**: Send OTP code to registered phone number

**Request Body**:

```typescript
interface SendOTPRequest {
  phoneNumber: string;      // +972XXXXXXXXX format
  recaptchaToken: string;   // Client-side reCAPTCHA token
}
```

**Response**:

```typescript
interface SendOTPResponse {
  success: boolean;
  data?: {
    verificationId: string;
    expiresAt: string;      // ISO timestamp
    cooldownSeconds: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

**Implementation**:

```typescript
// pages/api/auth/send-otp.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseAuth } from '@/lib/firebase-admin';
import { verifyRecaptcha } from '@/lib/recaptcha';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendOTPResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });
  }

  try {
    const { phoneNumber, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RECAPTCHA',
          message: 'אימות reCAPTCHA נכשל'
        }
      });
    }

    // Validate phone number
    if (!phoneNumber || !/^\+972[0-9]{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'מספר טלפון לא תקין'
        }
      });
    }

    // Check rate limiting for this phone number
    const rateLimitCheck = await checkPhoneRateLimit(phoneNumber);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'PHONE_RATE_LIMITED',
          message: `יותר מדי ניסיונות. נסה שנית בעוד ${rateLimitCheck.cooldownSeconds} שניות`
        }
      });
    }

    // Send OTP via Firebase
    const otpResult = await FirebaseAuth.sendOTP(phoneNumber);

    // Store verification session
    await storeVerificationSession({
      verificationId: otpResult.verificationId,
      phoneNumber,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0
    });

    return res.status(200).json({
      success: true,
      data: {
        verificationId: otpResult.verificationId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        cooldownSeconds: 60
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'OTP_SEND_FAILED',
        message: 'שליחת קוד אימות נכשלה'
      }
    });
  }
}
```

### 3. OTP Verification

#### `POST /api/auth/verify-otp`

**Purpose**: Verify OTP code and create user account

**Request Body**:

```typescript
interface VerifyOTPRequest {
  verificationId: string;
  otpCode: string;          // 6 digits
  userData: {
    firstName: string;
    lastName: string;
    rank: string;
    unit?: string;
  };
}
```

**Response**:

```typescript
interface VerifyOTPResponse {
  success: boolean;
  data?: {
    user: UserProfile;
    authToken: string;
    refreshToken: string;
  };
  error?: {
    code: string;
    message: string;
    attemptsLeft?: number;
  };
}
```

### 4. User Profile Creation

#### `POST /api/auth/create-user`

**Purpose**: Create complete user profile after successful verification

**Implementation**:

```typescript
// pages/api/auth/create-user.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseAuth, Firestore } from '@/lib/firebase-admin';
import { UserProfile } from '@/types/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { firebaseUser, userData } = req.body;

    // Create user profile document
    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      rank: userData.rank,
      unit: userData.unit,
      phoneNumber: firebaseUser.phoneNumber,
      phoneVerified: true,
      createdAt: Firestore.FieldValue.serverTimestamp(),
      lastLoginAt: Firestore.FieldValue.serverTimestamp(),
      status: 'active',
      role: 'soldier',
      preferences: {
        language: 'he',
        notifications: true,
        theme: 'light'
      },
      metadata: {
        registrationSource: 'web',
        registrationVersion: '1.0',
        userAgent: req.headers['user-agent'],
        ipAddress: getClientIP(req)
      }
    };

    // Save to Firestore
    await Firestore.collection('users')
      .doc(firebaseUser.uid)
      .set(userProfile);

    // Update Firebase Auth profile
    await FirebaseAuth.updateUser(firebaseUser.uid, {
      displayName: userProfile.fullName,
      customClaims: {
        role: 'soldier',
        verified: true
      }
    });

    // Generate custom token for immediate login
    const customToken = await FirebaseAuth.createCustomToken(
      firebaseUser.uid,
      { role: 'soldier', verified: true }
    );

    return res.status(201).json({
      success: true,
      data: {
        user: userProfile,
        authToken: customToken
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'USER_CREATION_FAILED',
        message: 'יצירת חשבון משתמש נכשלה'
      }
    });
  }
}
```

---

## 🔐 Security Implementation

### 1. Military ID Hashing

```typescript
// lib/security/militaryIdHashing.ts
import crypto from 'crypto';

export class MilitaryIdSecurity {
  
  static async hashMilitaryId(militaryId: string): Promise<{hash: string, salt: string}> {
    // Generate cryptographically secure random salt
    const salt = crypto.randomBytes(32).toString('hex');
    
    // Create SHA-256 hash with salt
    const hash = crypto
      .createHash('sha256')
      .update(`${militaryId}:${salt}:${process.env.MILITARY_ID_PEPPER}`)
      .digest('hex');
    
    return { hash, salt };
  }
  
  static async verifyMilitaryId(
    militaryId: string, 
    hash: string, 
    salt: string
  ): Promise<boolean> {
    const computedHash = crypto
      .createHash('sha256')
      .update(`${militaryId}:${salt}:${process.env.MILITARY_ID_PEPPER}`)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }
  
  static validateMilitaryIdFormat(militaryId: string): boolean {
    // Israeli military ID validation
    if (!/^[0-9]{7,8}$/.test(militaryId)) {
      return false;
    }
    
    // Additional checksum validation if needed
    return this.validateIsraeliIdChecksum(militaryId);
  }
  
  private static validateIsraeliIdChecksum(id: string): boolean {
    // Israeli ID checksum algorithm
    const digits = id.split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < digits.length - 1; i++) {
      let digit = digits[i] * ((i % 2) + 1);
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[digits.length - 1];
  }
}
```

### 2. Rate Limiting

```typescript
// lib/security/rateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  keyPrefix: string;    // Redis key prefix
}

export class RateLimiter {
  
  static async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{allowed: boolean, remaining: number, resetTime: number}> {
    
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Remove old entries and count current requests
    await redis.zremrangebyscore(key, 0, windowStart);
    const currentRequests = await redis.zcard(key);
    
    if (currentRequests >= config.maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetTime = oldestRequest[0] ? oldestRequest[1] + config.windowMs : now + config.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }
    
    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Specific rate limiters
  static async checkRegistrationAttempts(ip: string) {
    return this.checkLimit(ip, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,           // 5 attempts per 15 minutes
      keyPrefix: 'reg_attempt'
    });
  }
  
  static async checkOTPSends(phoneNumber: string) {
    return this.checkLimit(phoneNumber, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,           // 3 OTP sends per hour
      keyPrefix: 'otp_send'
    });
  }
  
  static async checkOTPVerifications(verificationId: string) {
    return this.checkLimit(verificationId, {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      maxRequests: 3,           // 3 verification attempts
      keyPrefix: 'otp_verify'
    });
  }
}
```

### 3. Input Validation & Sanitization

```typescript
// lib/security/validation.ts
import DOMPurify from 'isomorphic-dompurify';

export class InputValidator {
  
  // Hebrew name validation
  static validateHebrewName(name: string): ValidationResult {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'שם הוא שדה חובה' };
    }
    
    if (trimmed.length < 2 || trimmed.length > 20) {
      return { isValid: false, error: 'שם חייב להכיל 2-20 תווים' };
    }
    
    // Hebrew Unicode range: U+0590 to U+05FF
    if (!/^[\u0590-\u05FF\s]+$/.test(trimmed)) {
      return { isValid: false, error: 'שם חייב להכיל אותיות עבריות בלבד' };
    }
    
    // Check for consecutive spaces
    if (/\s{2,}/.test(trimmed)) {
      return { isValid: false, error: 'לא ניתן להכיל רווחים רצופים' };
    }
    
    return { isValid: true, sanitized: trimmed };
  }
  
  // Phone number validation
  static validatePhoneNumber(phone: string): ValidationResult {
    const cleaned = phone.replace(/[\s-()]/g, '');
    
    // Israeli phone number patterns
    const patterns = [
      /^(\+972|0)(5[0-9])[0-9]{7}$/,  // Mobile
      /^(\+972|0)[2-4,8-9][0-9]{7}$/  // Landline
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      return { isValid: false, error: 'מספר טלפון לא תקין' };
    }
    
    // Normalize to international format
    const normalized = cleaned.startsWith('+972') 
      ? cleaned 
      : '+972' + cleaned.substring(1);
    
    return { isValid: true, sanitized: normalized };
  }
  
  // Military rank validation
  static validateMilitaryRank(rank: string): ValidationResult {
    const validRanks = [
      'טוראי', 'טוראי ראשון', 'רב טוראי',
      'סמל', 'סמל ראשון', 'רב סמל', 'רב סמל מתקדם',
      'סגן', 'סגן משנה', 'סרן', 'רב סרן',
      'סגן אלוף', 'אלוף משנה', 'אלוף', 'רב אלוף'
    ];
    
    if (!validRanks.includes(rank)) {
      return { isValid: false, error: 'דרגה לא תקינה' };
    }
    
    return { isValid: true, sanitized: rank };
  }
  
  // General text sanitization
  static sanitizeText(input: string): string {
    return DOMPurify.sanitize(input.trim(), { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }
  
  // Complete registration form validation
  static validateRegistrationForm(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};
    
    // First name
    const firstNameResult = this.validateHebrewName(data.firstName);
    if (!firstNameResult.isValid) {
      errors.push(`שם פרטי: ${firstNameResult.error}`);
    } else {
      sanitized.firstName = firstNameResult.sanitized;
    }
    
    // Last name
    const lastNameResult = this.validateHebrewName(data.lastName);
    if (!lastNameResult.isValid) {
      errors.push(`שם משפחה: ${lastNameResult.error}`);
    } else {
      sanitized.lastName = lastNameResult.sanitized;
    }
    
    // Military ID
    if (!MilitaryIdSecurity.validateMilitaryIdFormat(data.militaryPersonalNumber)) {
      errors.push('מספר אישי: פורמט לא תקין');
    } else {
      sanitized.militaryPersonalNumber = data.militaryPersonalNumber;
    }
    
    // Phone number
    const phoneResult = this.validatePhoneNumber(data.phoneNumber);
    if (!phoneResult.isValid) {
      errors.push(`טלפון: ${phoneResult.error}`);
    } else {
      sanitized.phoneNumber = phoneResult.sanitized;
    }
    
    // Rank
    const rankResult = this.validateMilitaryRank(data.rank);
    if (!rankResult.isValid) {
      errors.push(`דרגה: ${rankResult.error}`);
    } else {
      sanitized.rank = rankResult.sanitized;
    }
    
    // Unit (optional)
    if (data.unit) {
      sanitized.unit = this.sanitizeText(data.unit);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
  sanitized?: any;
}
```

---

## 🔥 Firebase Integration

### 1. Firebase Admin Configuration

```typescript
// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const FirebaseAuth = getAuth();
export const Firestore = getFirestore();

// Phone authentication utilities
export class PhoneAuthService {
  
  static async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      // Create a verification session
      const sessionInfo = await FirebaseAuth.createSessionCookie(
        phoneNumber,
        { expiresIn: 5 * 60 * 1000 } // 5 minutes
      );
      
      return sessionInfo;
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new Error('Failed to send verification code');
    }
  }
  
  static async verifyPhoneAndCreateUser(
    phoneNumber: string,
    verificationCode: string
  ): Promise<any> {
    try {
      // Verify the phone number with Firebase
      const userRecord = await FirebaseAuth.createUser({
        phoneNumber,
        emailVerified: false,
        disabled: false
      });
      
      return userRecord;
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new Error('Phone verification failed');
    }
  }
  
  static async createCustomToken(
    uid: string,
    additionalClaims?: object
  ): Promise<string> {
    return FirebaseAuth.createCustomToken(uid, additionalClaims);
  }
}
```

### 2. Firestore Data Models

```typescript
// lib/firestore/models.ts
import { Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

export class UserModel {
  
  static async create(userData: UserProfile): Promise<void> {
    const userRef = Firestore.collection('users').doc(userData.uid);
    
    await userRef.set({
      ...userData,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      status: 'active'
    });
  }
  
  static async findByUid(uid: string): Promise<UserProfile | null> {
    const doc = await Firestore.collection('users').doc(uid).get();
    return doc.exists ? doc.data() as UserProfile : null;
  }
  
  static async findByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    const query = await Firestore
      .collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    return query.empty ? null : query.docs[0].data() as UserProfile;
  }
  
  static async updateLastLogin(uid: string): Promise<void> {
    await Firestore.collection('users').doc(uid).update({
      lastLoginAt: FieldValue.serverTimestamp()
    });
  }
}

export class AuthorizedPersonnelModel {
  
  static async findByHash(
    militaryIdHash: string,
    firstName: string,
    lastName: string
  ): Promise<AuthorizedPersonnel | null> {
    
    const query = await Firestore
      .collection('authorized_personnel')
      .where('militaryPersonalNumberHash', '==', militaryIdHash)
      .where('firstName', '==', firstName)
      .where('lastName', '==', lastName)
      .limit(1)
      .get();
    
    return query.empty ? null : query.docs[0].data() as AuthorizedPersonnel;
  }
  
  static async create(data: AuthorizedPersonnel): Promise<string> {
    const docRef = await Firestore.collection('authorized_personnel').add({
      ...data,
      createdAt: FieldValue.serverTimestamp()
    });
    
    return docRef.id;
  }
}

export class VerificationSessionModel {
  
  static async create(session: VerificationSession): Promise<void> {
    await Firestore
      .collection('verification_sessions')
      .doc(session.verificationId)
      .set({
        ...session,
        createdAt: FieldValue.serverTimestamp()
      });
  }
  
  static async findById(verificationId: string): Promise<VerificationSession | null> {
    const doc = await Firestore
      .collection('verification_sessions')
      .doc(verificationId)
      .get();
    
    return doc.exists ? doc.data() as VerificationSession : null;
  }
  
  static async incrementAttempts(verificationId: string): Promise<void> {
    await Firestore
      .collection('verification_sessions')
      .doc(verificationId)
      .update({
        attempts: FieldValue.increment(1),
        lastAttemptAt: FieldValue.serverTimestamp()
      });
  }
  
  static async markAsUsed(verificationId: string): Promise<void> {
    await Firestore
      .collection('verification_sessions')
      .doc(verificationId)
      .update({
        used: true,
        usedAt: FieldValue.serverTimestamp()
      });
  }
}
```

---

## 📊 Monitoring & Analytics

### 1. Authentication Metrics

```typescript
// lib/analytics/authMetrics.ts
import { Analytics } from '@/lib/analytics';

export class AuthMetrics {
  
  static trackRegistrationStarted(metadata: {
    userAgent: string;
    referrer: string;
    timestamp: Date;
  }) {
    Analytics.track('registration_started', {
      event_category: 'auth',
      event_label: 'registration_flow',
      custom_parameters: {
        user_agent: metadata.userAgent,
        referrer: metadata.referrer,
        timestamp: metadata.timestamp.toISOString()
      }
    });
  }
  
  static trackMilitaryIdVerification(success: boolean, errorCode?: string) {
    Analytics.track('military_id_verification', {
      event_category: 'auth',
      event_label: success ? 'success' : 'failure',
      custom_parameters: {
        success,
        error_code: errorCode,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  static trackOTPSent(phoneNumber: string, attempt: number) {
    const hashedPhone = this.hashForAnalytics(phoneNumber);
    
    Analytics.track('otp_sent', {
      event_category: 'auth',
      event_label: 'phone_verification',
      custom_parameters: {
        phone_hash: hashedPhone,
        attempt_number: attempt,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  static trackOTPVerified(success: boolean, attemptNumber: number) {
    Analytics.track('otp_verified', {
      event_category: 'auth',
      event_label: success ? 'success' : 'failure',
      custom_parameters: {
        success,
        attempt_number: attemptNumber,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  static trackRegistrationCompleted(userData: {
    rank: string;
    hasUnit: boolean;
    timeToComplete: number; // milliseconds
  }) {
    Analytics.track('registration_completed', {
      event_category: 'auth',
      event_label: 'success',
      value: userData.timeToComplete,
      custom_parameters: {
        rank: userData.rank,
        has_unit: userData.hasUnit,
        time_to_complete_ms: userData.timeToComplete,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  static trackRegistrationAbandoned(step: string, timeSpent: number) {
    Analytics.track('registration_abandoned', {
      event_category: 'auth',
      event_label: step,
      value: timeSpent,
      custom_parameters: {
        abandoned_at_step: step,
        time_spent_ms: timeSpent,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  private static hashForAnalytics(input: string): string {
    // Create a consistent but anonymized hash for analytics
    return require('crypto')
      .createHash('sha256')
      .update(input + process.env.ANALYTICS_SALT)
      .digest('hex')
      .substring(0, 8);
  }
}
```

### 2. Error Tracking

```typescript
// lib/monitoring/errorTracking.ts
import * as Sentry from '@sentry/nextjs';

export class AuthErrorTracker {
  
  static trackAuthenticationError(error: Error, context: {
    step: string;
    userId?: string;
    phoneNumber?: string;
    metadata?: object;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'authentication');
      scope.setTag('step', context.step);
      scope.setLevel('error');
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context.phoneNumber) {
        scope.setContext('phone', {
          hashed: this.hashSensitiveData(context.phoneNumber)
        });
      }
      
      if (context.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      Sentry.captureException(error);
    });
  }
  
  static trackValidationError(errors: string[], formData: object) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'validation');
      scope.setLevel('warning');
      scope.setContext('validation_errors', { errors });
      scope.setContext('form_data', {
        // Hash sensitive fields
        firstName_length: formData.firstName?.length,
        lastName_length: formData.lastName?.length,
        has_military_id: !!formData.militaryPersonalNumber,
        has_phone: !!formData.phoneNumber
      });
      
      Sentry.captureMessage('Form validation failed', 'warning');
    });
  }
  
  static trackRateLimitExceeded(identifier: string, limitType: string) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'rate_limiting');
      scope.setTag('limit_type', limitType);
      scope.setLevel('warning');
      scope.setContext('rate_limit', {
        identifier_hash: this.hashSensitiveData(identifier),
        limit_type: limitType,
        timestamp: new Date().toISOString()
      });
      
      Sentry.captureMessage('Rate limit exceeded', 'warning');
    });
  }
  
  private static hashSensitiveData(data: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(data + process.env.ERROR_TRACKING_SALT)
      .digest('hex')
      .substring(0, 12);
  }
}
```

---

## 🧪 Testing Strategy

### 1. API Testing

```typescript
// tests/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/auth/verify-military-id';

describe('/api/auth/verify-military-id', () => {
  
  it('should verify valid military ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        militaryPersonalNumber: '1234567',
        firstName: 'יוסי',
        lastName: 'כהן'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.authorized).toBe(true);
  });

  it('should reject invalid military ID format', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        militaryPersonalNumber: '123', // Too short
        firstName: 'יוסי',
        lastName: 'כהן'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle rate limiting', async () => {
    // Mock multiple rapid requests
    for (let i = 0; i < 6; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' },
        body: {
          militaryPersonalNumber: '1234567',
          firstName: 'יוסי',
          lastName: 'כהן'
        }
      });

      await handler(req, res);
      
      if (i === 5) {
        expect(res._getStatusCode()).toBe(429);
      }
    }
  });
});
```

### 2. Security Testing

```typescript
// tests/security/security.test.ts
import { MilitaryIdSecurity } from '@/lib/security/militaryIdHashing';
import { InputValidator } from '@/lib/security/validation';

describe('Security Components', () => {
  
  describe('Military ID Hashing', () => {
    it('should generate different hashes for same input', async () => {
      const militaryId = '1234567';
      const hash1 = await MilitaryIdSecurity.hashMilitaryId(militaryId);
      const hash2 = await MilitaryIdSecurity.hashMilitaryId(militaryId);
      
      expect(hash1.hash).not.toBe(hash2.hash);
      expect(hash1.salt).not.toBe(hash2.salt);
    });
    
    it('should verify correct military ID', async () => {
      const militaryId = '1234567';
      const { hash, salt } = await MilitaryIdSecurity.hashMilitaryId(militaryId);
      
      const isValid = await MilitaryIdSecurity.verifyMilitaryId(
        militaryId, hash, salt
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should reject incorrect military ID', async () => {
      const militaryId = '1234567';
      const wrongId = '7654321';
      const { hash, salt } = await MilitaryIdSecurity.hashMilitaryId(militaryId);
      
      const isValid = await MilitaryIdSecurity.verifyMilitaryId(
        wrongId, hash, salt
      );
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('Input Validation', () => {
    it('should validate Hebrew names correctly', () => {
      const validNames = ['יוסי', 'מרים', 'אבי אהרון'];
      const invalidNames = ['John', 'Мария', '123', 'test@email.com'];
      
      validNames.forEach(name => {
        const result = InputValidator.validateHebrewName(name);
        expect(result.isValid).toBe(true);
      });
      
      invalidNames.forEach(name => {
        const result = InputValidator.validateHebrewName(name);
        expect(result.isValid).toBe(false);
      });
    });
    
    it('should validate phone numbers correctly', () => {
      const validPhones = ['+972501234567', '0501234567', '050-123-4567'];
      const invalidPhones = ['123', '+1234567890', 'not-a-phone'];
      
      validPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toMatch(/^\+972\d{9}$/);
      });
      
      invalidPhones.forEach(phone => {
        const result = InputValidator.validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
      });
    });
  });
});
```

### 3. Integration Testing

```typescript
// tests/integration/registration-flow.test.ts
import { testFirestore, testAuth } from '@/lib/test-utils';

describe('Registration Flow Integration', () => {
  
  beforeEach(async () => {
    await testFirestore.clearAllData();
    await testAuth.clearAllUsers();
  });
  
  it('should complete full registration flow', async () => {
    // 1. Setup authorized personnel
    await testFirestore.collection('authorized_personnel').add({
      militaryPersonalNumberHash: 'test-hash',
      salt: 'test-salt',
      firstName: 'יוסי',
      lastName: 'כהן',
      rank: 'סמל',
      phoneNumber: '+972501234567'
    });
    
    // 2. Verify military ID
    const militaryIdResponse = await fetch('/api/auth/verify-military-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        militaryPersonalNumber: '1234567',
        firstName: 'יוסי',
        lastName: 'כהן'
      })
    });
    
    expect(militaryIdResponse.status).toBe(200);
    
    // 3. Send OTP
    const otpResponse = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+972501234567',
        recaptchaToken: 'test-token'
      })
    });
    
    expect(otpResponse.status).toBe(200);
    const otpData = await otpResponse.json();
    
    // 4. Verify OTP and create user
    const verifyResponse = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: otpData.data.verificationId,
        otpCode: '123456',
        userData: {
          firstName: 'יוסי',
          lastName: 'כהן',
          rank: 'סמל'
        }
      })
    });
    
    expect(verifyResponse.status).toBe(200);
    const userData = await verifyResponse.json();
    
    // 5. Verify user was created in Firestore
    const userDoc = await testFirestore
      .collection('users')
      .doc(userData.data.user.uid)
      .get();
    
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.firstName).toBe('יוסי');
  });
});
```

---

## 🚀 Deployment Configuration

### 1. Environment Variables

```bash
# .env.production
# Firebase Configuration
FIREBASE_PROJECT_ID=sayeret-givati-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@sayeret-givati-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security
MILITARY_ID_PEPPER=super-secret-pepper-value
ANALYTICS_SALT=analytics-salt-value
ERROR_TRACKING_SALT=error-tracking-salt-value

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...XXX

# External Services
RECAPTCHA_SECRET_KEY=6Lf...XXX
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://sayeret-givati.vercel.app
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lf...XXX
```

### 2. Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase-project-id",
    "FIREBASE_CLIENT_EMAIL": "@firebase-client-email", 
    "FIREBASE_PRIVATE_KEY": "@firebase-private-key",
    "MILITARY_ID_PEPPER": "@military-id-pepper",
    "UPSTASH_REDIS_REST_URL": "@redis-url",
    "UPSTASH_REDIS_REST_TOKEN": "@redis-token"
  },
  "functions": {
    "pages/api/auth/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/auth/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://sayeret-givati.vercel.app'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 📈 Performance Optimization

### 1. API Response Caching

```typescript
// lib/cache/apiCache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class APICache {
  
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
  
  // Cache authorized personnel queries
  static async cacheAuthorizedPersonnel(hash: string, data: any): Promise<void> {
    const key = `auth:personnel:${hash}`;
    await this.set(key, data, 24 * 60 * 60); // 24 hours
  }
  
  static async getCachedAuthorizedPersonnel(hash: string): Promise<any> {
    const key = `auth:personnel:${hash}`;
    return this.get(key);
  }
}
```

### 2. Database Connection Optimization

```typescript
// lib/firestore/connectionPool.ts
import { Firestore } from 'firebase-admin/firestore';

class FirestoreConnectionPool {
  private static instance: FirestoreConnectionPool;
  private firestore: Firestore;
  private connectionCount = 0;
  private maxConnections = 10;
  
  private constructor() {
    this.firestore = Firestore;
    this.setupOptimizations();
  }
  
  static getInstance(): FirestoreConnectionPool {
    if (!FirestoreConnectionPool.instance) {
      FirestoreConnectionPool.instance = new FirestoreConnectionPool();
    }
    return FirestoreConnectionPool.instance;
  }
  
  private setupOptimizations() {
    // Configure Firestore settings for optimal performance
    this.firestore.settings({
      ignoreUndefinedProperties: true,
      merge: true
    });
  }
  
  async query<T>(
    collection: string,
    queryFn?: (ref: any) => any
  ): Promise<T[]> {
    this.connectionCount++;
    
    try {
      let ref = this.firestore.collection(collection);
      
      if (queryFn) {
        ref = queryFn(ref);
      }
      
      const snapshot = await ref.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      
    } finally {
      this.connectionCount--;
    }
  }
  
  async batchWrite(operations: any[]): Promise<void> {
    const batch = this.firestore.batch();
    
    operations.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    });
    
    await batch.commit();
  }
}

export const FirestorePool = FirestoreConnectionPool.getInstance();
```

---

## 🔄 Maintenance & Updates

### 1. Health Checks

```typescript
// pages/api/auth/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseAuth, Firestore } from '@/lib/firebase-admin';
import { Redis } from '@upstash/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const healthChecks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      firebase_auth: false,
      firestore: false,
      redis: false,
      api: true
    },
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check Firebase Auth
    await FirebaseAuth.listUsers(1);
    healthChecks.services.firebase_auth = true;
  } catch (error) {
    console.error('Firebase Auth health check failed:', error);
  }

  try {
    // Check Firestore
    await Firestore.collection('health_check').limit(1).get();
    healthChecks.services.firestore = true;
  } catch (error) {
    console.error('Firestore health check failed:', error);
  }

  try {
    // Check Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.ping();
    healthChecks.services.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  // Determine overall status
  const allHealthy = Object.values(healthChecks.services).every(Boolean);
  healthChecks.status = allHealthy ? 'healthy' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(healthChecks);
}
```

### 2. Database Migrations

```typescript
// scripts/migrations/001-add-user-metadata.ts
import { Firestore } from 'firebase-admin/firestore';

export async function migrateUserMetadata() {
  console.log('Starting user metadata migration...');
  
  const usersRef = Firestore.collection('users');
  const snapshot = await usersRef.get();
  
  const batch = Firestore.batch();
  let updateCount = 0;
  
  snapshot.docs.forEach(doc => {
    const userData = doc.data();
    
    // Add missing metadata fields
    if (!userData.metadata) {
      batch.update(doc.ref, {
        metadata: {
          registrationSource: 'legacy',
          registrationVersion: '1.0',
          migratedAt: new Date().toISOString()
        }
      });
      updateCount++;
    }
  });
  
  if (updateCount > 0) {
    await batch.commit();
    console.log(`Migration completed. Updated ${updateCount} user records.`);
  } else {
    console.log('No users needed migration.');
  }
}
```

---

**מסמך זה מספק את כל הפרטים הטכניים הנדרשים ליישום מערכת האימות המלאה.** 🔧
