# phoneChangeService.ts

**File:** `src/lib/db/server/phoneChangeService.ts`
**Status:** Active (Settings PR-C)

## Purpose

Server-side service for the two-phase phone-change flow. Exposes three operations:
- `serverInitiatePhoneChange({ uid, actorUid, newPhoneE164 })` — rate-limit + same-number guard + nonce-bound pending reservation.
- `serverConfirmPhoneChange({ uid, newPhoneE164, nonce, tokenPhoneNumber, tokenAuthTimeSeconds })` — proof checks + atomic mirror + sessionEpoch stamp + personnel reverse-sync.
- `serverCancelPhoneChange(uid)` — idempotent pending delete.

Routes live in `src/app/api/users/phone-change/*/route.ts`. The HTTP layer there is thin; this service holds the policy.

## Custom error classes

Each is a distinct subclass so routes can map them to specific 400-level responses with stable `code` fields the client UI can branch on without parsing messages.

| Error | Fires when | Route code |
|-------|-----------|-----------|
| `PhoneChangeRateLimitError` | A previous initiate by the same `uid` lies within the 60s window | `429 rate_limited` |
| `PhoneChangePhoneInUseError` | `newPhoneE164` equals the user's current `phoneNumber` | `400 same_number` |
| `PhoneChangeNoPendingError` | Confirm fired but no pending doc exists | `400 no_pending` |
| `PhoneChangeNonceMismatchError` | Pending nonce ≠ client-echoed nonce | `400 nonce_mismatch` |
| `PhoneChangeTargetMismatchError` | Pending `newPhoneE164` ≠ body `newPhoneE164` | `400 phone_mismatch` |
| `PhoneChangeProofMissingError` | idToken `phone_number` claim ≠ body `newPhoneE164` | `400 phone_mismatch` |
| `PhoneChangeAuthTooOldError` | idToken `auth_time` ≤ pending `createdAt` (replay protection) | `400 phone_mismatch` |

## Idempotency window

`serverConfirmPhoneChange` recognises a retry as a no-op when:
1. `phoneChangePending/{uid}` is gone, AND
2. `users.phoneNumber === tokenPhoneNumber === newPhoneE164`.

In that case the service returns success with the existing `sessionEpoch` instead of re-stamping it. Lets the client retry on a 504 between confirm POST and the 200 receipt without producing duplicate audit rows.

## Reverse sync scope

After the mirror batch commits, the service calls `serverWritePhoneToPersonnel(militaryIdHash, newPhoneE164)` on the `authorized_personnel` roster. The reverse sync is narrow — it touches only `phoneNumber`, not status / role / name. Failure here is logged but does NOT roll back the mirror (the user's phone is already changed in Auth + Firestore — refusing to reverse-sync would only widen drift).

## Rate-limit shadow

`phoneChangeRateLimit/{uid}` is a separate single-field collection tracking `lastInitiateAt`. Server-only access via Firestore rules. The shadow is read inside `serverInitiatePhoneChange` and written unconditionally on success.

## Not handled here

- Audit logging — fires in `confirm/route.ts` after the mirror succeeds.
- phoneBook write-through — also in `confirm/route.ts`.
- `revokeRefreshTokens` is intentionally NOT called. The Firestore sessionEpoch fence is the chosen mechanism for cutting other devices (current device passes the fence; other devices fail it).
