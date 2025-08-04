# 📱 OTP Verification Implementation

## 🚀 Overview

This document describes the OTP (One-Time Password) verification system implemented for the Sayeret Givati equipment management system using Twilio SMS service.

## 🔧 Architecture

### Components

1. **OTP Utilities** (`src/lib/otpUtils.ts`)
   - OTP code generation
   - Session management in Firestore
   - Rate limiting
   - Code verification

2. **Twilio Service** (`src/lib/twilioService.ts`)
   - SMS sending via Twilio Messaging Service
   - Phone number validation and formatting
   - Error handling for SMS delivery

3. **API Endpoints**
   - `/api/auth/send-otp` - Generate and send OTP codes
   - `/api/auth/verify-otp` - Verify submitted OTP codes

## 📋 API Reference

### Send OTP - `POST /api/auth/send-otp`

Generates and sends a 6-digit OTP code to the specified phone number.

**Request Body:**

```json
{
  "phoneNumber": "+972501234567"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "קוד אימות נשלח בהצלחה",
  "phoneNumber": "+972501234567",
  "attemptsRemaining": 4,
  "expiresInMinutes": 5
}
```

**Rate Limited Response (429):**

```json
{
  "success": false,
  "error": "יותר מדי ניסיונות. נסה שוב ב-14:30",
  "rateLimited": true,
  "resetTime": "2025-01-14T14:30:00.000Z"
}
```

### Verify OTP - `POST /api/auth/verify-otp`

Verifies the submitted OTP code against the stored session.

**Request Body:**

```json
{
  "phoneNumber": "+972501234567",
  "otpCode": "123456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "קוד האימות אומת בהצלחה",
  "phoneNumber": "+972501234567",
  "verified": true
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "קוד האימות שגוי"
}
```

## 🔒 Security Features

### Rate Limiting

- **Limit**: 5 OTP requests per phone number per hour
- **Storage**: Firestore collection `otp_rate_limits`
- **Reset**: Automatic after 1 hour window

### OTP Security

- **Format**: 6-digit numeric string
- **Expiration**: 5 minutes from generation
- **One-time use**: Deleted after successful verification
- **No logging**: OTP codes are never logged for security

### Phone Number Validation

- **Format**: E.164 international format
- **Israeli numbers**: Automatic formatting (+972XXXXXXXXX)
- **Validation**: Length and format checks

## 🏗️ Database Schema

### OTP Sessions Collection (`otp_sessions`)

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | `string` | Formatted phone number (Document ID) |
| `otpCode` | `string` | 6-digit verification code |
| `createdAt` | `timestamp` | Creation time |
| `expiresAt` | `timestamp` | Expiration time (5 minutes) |
| `verified` | `boolean` | Verification status |

### Rate Limit Collection (`otp_rate_limits`)

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | `string` | Phone number (Document ID) |
| `attempts` | `number` | Number of OTP requests |
| `firstAttemptAt` | `timestamp` | First request in current window |
| `lastAttemptAt` | `timestamp` | Most recent request |

## 🌍 Environment Variables

Required environment variables in `.env.local`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
MESSAGING_SERVICE_SID=your_messaging_service_sid
```

## 📱 SMS Message Format

Hebrew message sent to users:

```ascii
קוד האימות שלך: 123456

קוד זה תקף למשך 5 דקות בלבד.
צה"ל - יחידת סיירת גבעתי
```

## 🔧 Integration with Registration Flow

The OTP system integrates with the existing registration flow:

1. **Military ID Verification** → Phone number retrieved via O(1) hash lookup
2. **OTP Generation** → Send OTP to retrieved phone number
3. **OTP Verification** → Validate submitted code
4. **Registration Continue** → Proceed to personal details

## 🛠️ Maintenance Functions

### Cleanup Expired Sessions

```typescript
const deletedCount = await OTPManager.cleanupExpiredSessions();
```

### Rate Limit Check

```typescript
const rateLimitStatus = await OTPManager.checkRateLimit(phoneNumber);
```

## 🐛 Error Handling

All errors are handled gracefully with:

- Hebrew error messages for users
- Detailed logging for developers
- Proper HTTP status codes
- Security-conscious error responses (no sensitive data exposure)

## 🚀 Future Enhancements

- Voice call fallback for SMS delivery issues
- Multiple language support
- Advanced fraud detection
- OTP retry mechanisms
- Analytics dashboard for OTP metrics
