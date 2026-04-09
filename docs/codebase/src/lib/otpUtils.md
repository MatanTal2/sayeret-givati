# otpUtils.ts

**File:** `src/lib/otpUtils.ts`  
**Lines:** 251  
**Status:** Active

## Purpose

OTP generation, verification, and rate limiting with Firestore persistence. Manages OTP sessions (creation, verification, expiry) and rate limits per phone number.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `OTPSession` | interface | OTP session shape (code, phone, expiry, attempts) |
| `RateLimitSession` | interface | Rate limit tracking shape |
| `OTPManager` | class (static) | `generateOTP()`, `createSession()`, `verifyOTP()`, `cleanupExpired()`, `checkRateLimit()` |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `otp_sessions` | `setDoc` | `createSession()` |
| `otp_sessions` | `getDoc` | `verifyOTP()` |
| `otp_sessions` | `deleteDoc` | `verifyOTP()` (on success), `cleanupExpired()` |
| `otp_rate_limits` | `setDoc` | `checkRateLimit()` |
| `otp_rate_limits` | `getDoc` | `checkRateLimit()` |
| `otp_rate_limits` | `getDocs` | `cleanupExpired()` |
| `otp_rate_limits` | `deleteDoc` | `cleanupExpired()` |
