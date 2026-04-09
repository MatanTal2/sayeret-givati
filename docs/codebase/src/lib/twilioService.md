# twilioService.ts

**File:** `src/lib/twilioService.ts`  
**Lines:** 101  
**Status:** Active

## Purpose

SMS OTP delivery via Twilio API. Sends OTP codes to phone numbers using Twilio's Messaging Service.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `TwilioService` | class (static) | `sendOTP(phone, code)`, `formatPhoneNumber()` (deprecated), `validatePhoneNumber()` (deprecated) |

## Notes

- Used by API routes (`/api/auth/send-otp`), not directly by client code.
- `formatPhoneNumber` and `validatePhoneNumber` are marked `@deprecated`.
