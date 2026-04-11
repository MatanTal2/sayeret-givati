# route.ts (register)

**File:** `src/app/api/auth/register/route.ts`
**Lines:** 89
**Status:** Active

## Purpose

API route `POST /api/auth/register`. Accepts full registration data (after OTP verification has already completed on the client), creates the Firestore `users` document, and marks the `authorized_personnel` record as registered. Firebase Auth account creation happens on the client side before this route is called — the `firebaseAuthUid` is passed in the body.

## Exports / Public API

- `POST(request: NextRequest)` — Next.js route handler.

## Request Body

```json
{
  "email": "...",
  "password": "...",
  "firstName": "...",
  "lastName": "...",
  "gender": "...",
  "birthdate": "...",
  "phoneNumber": "...",
  "militaryPersonalNumber": "...",
  "firebaseAuthUid": "..."
}
```

## Response

```json
{ "success": true, "userId": "...", "message": "Registration successful" }
{ "success": false, "error": "..." }
```

## Firebase Operations

Delegated to `UserService.registerUser`:

| Collection | Operation |
|------------|-----------|
| `users` | `setDoc` — create user profile |
| `authorized_personnel` | `updateDoc` — mark `isRegistered: true` |

## Notes

- `password` is received but `UserService.registerUser` likely does not use it (Firebase Auth account is already created client-side before this route is called). This field may be vestigial.
