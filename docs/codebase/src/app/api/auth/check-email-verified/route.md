# check-email-verified/route.ts

**File:** `src/app/api/auth/check-email-verified/route.ts`
**Status:** Active

## Purpose

Server-only endpoint that looks up a Firebase Auth user by email via the Admin SDK and returns the `emailVerified` flag. Used by the forgot-password flow to gate password reset on a verified email.

## Request

`POST /api/auth/check-email-verified`
```json
{ "email": "user@example.com" }
```

## Response

```json
{ "status": "verified" | "unverified" | "not-found" | "invalid" | "error" }
```

| Status | Meaning |
|--------|---------|
| `verified` | User exists and email is verified — client may send reset. |
| `unverified` | User exists but email not verified — client should block reset and ask user to verify. |
| `not-found` | No user. Surface as a generic success to avoid account-existence reveal. |
| `invalid` | Missing or non-string email in request. |
| `error` | Server-side failure. |

## Implementation

Uses `getAdminAuth().getUserByEmail(email)` from `src/lib/db/admin.ts`. Catches `auth/user-not-found` to differentiate from real failures.

## Notes

- Requires the Admin SDK service account key (`GOOGLE_SERVICE_ACCOUNT_JSON`) to be valid for the active Firebase project.
- No auth check on the endpoint itself — it returns only a boolean per email, which is acceptable since the not-found case is generic.
