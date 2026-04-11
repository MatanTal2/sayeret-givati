# route.ts (verify-otp)

**File:** `src/app/api/auth/verify-otp/route.ts`
**Lines:** 115
**Status:** Active

## Purpose

API route `POST /api/auth/verify-otp`. Validates a submitted OTP code against the stored (hashed) value in `otp_sessions`. Returns success with a verified flag or failure with an error message.

## Exports / Public API

- `POST(request: NextRequest)` — Next.js route handler.

## Request Body

```json
{ "phoneNumber": "+972501234567", "otpCode": "123456" }
```

## Response

```json
{ "success": true, "message": "OTP verified successfully" }
{ "success": false, "error": "..." }
```

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|---------|
| `otp_sessions` | `getDoc` | `OTPManager.verifyOTP` |
| `otp_sessions` | `updateDoc` | `OTPManager.clearOTP` (marks as verified) |

## Flow

1. Validate `phoneNumber` and `otpCode` are present strings
2. Validate OTP format: must be exactly 6 digits
3. Format phone number via `PhoneUtils.validatePhoneNumber`
4. Verify OTP via `OTPManager.verifyOTP` (checks hash, expiry, attempt count)
5. Return success/failure

## Notes

- Error message for invalid OTP format is in Hebrew (inline string, not from `TEXT_CONSTANTS` — inconsistency).
