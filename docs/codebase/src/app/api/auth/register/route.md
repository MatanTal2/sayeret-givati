# route.ts (register)

**File:** `src/app/api/auth/register/route.ts`
**Status:** Active

## Purpose

`POST /api/auth/register`. Creates the Firestore `users` profile document and flips the matching `authorized_personnel` record's `registered` flag, after the client has already linked email+password onto the phone-OTP Firebase Auth user. The route runs entirely against firebase-admin — it does not call any other internal API route.

## Exports

- `POST(request: NextRequest)` — route handler
- `GET()` — 405 stub

## Request Body

```json
{
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "gender": "...",
  "birthdate": "YYYY-MM-DD",
  "phoneNumber": "+9725...",
  "militaryPersonalNumber": "1234567",
  "firebaseAuthUid": "...",
  "emailVerified": false
}
```

## Response

```json
{ "success": true, "uid": "...", "message": "User profile created successfully" }
{ "success": false, "error": "..." }
```

## Firebase Operations (admin SDK)

| Collection | Operation | Notes |
|------------|-----------|-------|
| `authorized_personnel/{hash}` | `get` | Look up rank + userType by hashed military ID |
| `users/{uid}` | `get` | Idempotency check — re-call after success returns 200 with `userType` from the personnel record |
| `users/{uid}` | `set` | Create profile (server timestamps + default communication preferences) |
| `authorized_personnel/{hash}` | `update` | `registered: true`, `updatedAt` |

## Notes

- The Firebase Auth user (phone + email/password) is created client-side via `signInWithPhoneNumber` → `linkWithCredential`. This route only writes Firestore.
- If the user document already exists, the route still re-marks the personnel record as registered, then returns success — keeps the flow idempotent if the client retries.
- `details` is included in the error response only in `NODE_ENV !== 'production'`.
