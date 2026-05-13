# /api/users/phone-change/initiate

**File:** `src/app/api/users/phone-change/initiate/route.ts`
**Status:** Active (Settings PR-C)

## Purpose

First leg of the two-phase phone-change flow. Reserves a pending slot for the authenticated caller and returns a server-issued opaque nonce that the client must echo back on `/confirm`. Without this nonce binding, a leaked idToken could replay confirm against a different target number.

## Contract

`POST /api/users/phone-change/initiate`

Headers: `Authorization: Bearer <idToken>`

Body:
```json
{ "newPhoneE164": "+972501234567" }
```

Responses:
- `200 { success: true, nonce: "<hex>" }` — slot reserved, write `phoneChangePending/{uid}` + bump rate-limit shadow.
- `400 { success: false, error: "same_number" }` — `newPhoneE164` equals the user's current phone. Saves SMS quota on no-op clicks.
- `400 { success: false, error: "newPhoneE164 must be E.164 format" }` — fails the `^\+\d{8,15}$` check.
- `429 { success: false, error: "rate_limited" }` — same `uid` initiated < 60s ago.
- `401 / 403` — bearer token missing / invalid / session-epoch fenced out / no user doc.

## Behavior

- Self-serve only. The caller may initiate for their own `uid`; admin force-reset goes through a separate planned PR (Q4=b).
- Pending docs are written by `serverInitiatePhoneChange` with `actorUid === uid`. An existing pending doc for the same actor is overwritten (never 409s a self-call), so a user who restarts the modal isn't blocked by their own previous attempt.
- Rate-limit data lives in a separate collection (`phoneChangeRateLimit/{uid}`) so a successful initiate doesn't permanently lock out further attempts — it only enforces a 60s cool-down.

## Out of scope here

- App Check / reCAPTCHA Enterprise gating — not initialized in this codebase yet (Council "should-have" follow-up).
- IP-based rate limit — only `(uid)` is rate-limited today. A `(uid, destinationPhone, ip)` composite is tracked as a follow-up.
