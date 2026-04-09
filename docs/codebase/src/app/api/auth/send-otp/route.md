# route.ts (send-otp)

**File:** `src/app/api/auth/send-otp/route.ts`
**Lines:** 107
**Status:** Active

## Purpose

API route `POST /api/auth/send-otp`. Validates a phone number, checks rate limits, generates a 6-digit OTP, stores it in the `otp_sessions` Firestore collection (hashed, with expiry), and delivers it via Twilio SMS. Returns success/failure JSON.

## Exports / Public API

- `POST(request: NextRequest)` — Next.js route handler.

## Request Body

```json
{ "phoneNumber": "+972501234567" }
```

## Response

```json
{ "success": true, "message": "OTP sent" }
{ "success": false, "error": "..." }
```

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|---------|
| `otp_sessions` | `getDoc` (rate limit check) | `OTPManager.checkRateLimit` |
| `otp_sessions` | `setDoc` | `OTPManager.storeOTP` |

## Flow

1. Validate `phoneNumber` exists and is a string
2. Validate/format phone with `PhoneUtils.validatePhoneNumber`
3. Rate limit check via `OTPManager.checkRateLimit` (5 attempts/hour)
4. Generate OTP via `OTPManager.generateOTP`
5. Store hashed OTP via `OTPManager.storeOTP`
6. Send SMS via `TwilioService.sendOTP`
7. Return success

## Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Missing/invalid phone number |
| 429 | Rate limit exceeded (returns reset time in Hebrew) |
| 500 | OTP store failed or Twilio send failed |
