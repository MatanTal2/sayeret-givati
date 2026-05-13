# /api/users/phone-change/confirm

**File:** `src/app/api/users/phone-change/confirm/route.ts`
**Status:** Active (Settings PR-C)

## Purpose

Second leg of the two-phase phone-change flow. The client has just completed `updatePhoneNumber(currentUser, credential)` on Firebase Auth and refreshed its idToken. This route reads the bearer token's `phone_number` and `auth_time` claims, validates them against the pending reservation, and commits the Firestore mirror atomically.

## Contract

`POST /api/users/phone-change/confirm`

Headers: `Authorization: Bearer <fresh idToken>` — must be minted **after** `updatePhoneNumber` (i.e. via `getIdToken(true)`), otherwise the `phone_number` claim is stale.

Body:
```json
{ "newPhoneE164": "+972501234567", "nonce": "<hex from /initiate>" }
```

Responses:
- `200 { success: true }` — Firestore mirrored. The route additionally refreshes the phoneBook entry, writes a `PHONE_CHANGED` audit row with hashed numbers, and stamps `users/{uid}.sessionEpoch` to cut other devices.
- `400 { success: false, error, code: 'no_pending' }` — no `phoneChangePending` doc for this uid.
- `400 { success: false, error, code: 'nonce_mismatch' }` — supplied nonce ≠ pending nonce.
- `400 { success: false, error, code: 'phone_mismatch' }` — pending target ≠ body target, OR body target ≠ idToken `phone_number` (even after the propagation retry), OR idToken `auth_time` predates pending `createdAt`.
- `500 { success: false, error, code: 'mirror_failed' }` — Firestore batch commit raised. The pending doc is left intact so the client can retry.

## Behavior

1. `getActorOrError` validates the bearer token, runs `checkRevoked: true`, and enforces the `sessionEpoch` fence on the user doc.
2. The route then re-runs `verifyIdToken(idToken, true)` itself to access the raw `phone_number` and `auth_time` claims that `getActorOrError` strips.
3. If `phone_number !== newPhoneE164` on first read, sleep 500 ms and re-verify once. Firebase's STS endpoint can lag `updatePhoneNumber` by a few hundred milliseconds; this absorbs the propagation race without surfacing a spurious error.
4. `serverConfirmPhoneChange` performs the mirror in a single batch (`users` update + `phoneChangePending` delete), then reverse-syncs the personnel roster outside the batch (different doc shape, optional — failure is logged, not fatal).
5. After the mirror commits, the route fires three side-effects sequentially, each wrapped in its own try/catch so a partial side-effect failure doesn't fail the request:
   - `serverUpsertPhoneBookFromUser` — phoneBook reflects the new number for unit-directory searches.
   - `writeCredentialAuditEvent({ eventType: 'PHONE_CHANGED' })` — IP + UA captured server-side; metadata carries only SHA-256 hashes of old + new numbers (never plaintext).

## Idempotency

A retried confirm against the same target succeeds with no rewrite when `phoneChangePending/{uid}` is already gone AND `users.phoneNumber === decoded.phone_number`. Lets the client safely retry on a transient network failure between confirm POST and 200 receipt.

## Session-epoch fence

`serverConfirmPhoneChange` stamps `users/{uid}.sessionEpoch = decoded.auth_time * 1000`. The confirming device's idToken passes the fence in `getActorFromRequest` because it carries the same `auth_time` (it was minted from the password re-auth that drove this flow). All other devices have older `auth_time` and are rejected at the next API call. This is intentionally cheaper than `revokeRefreshTokens` because it cuts only stale-auth-time tokens, leaving the current device alive — the stolen-laptop threat model the Council flagged.
