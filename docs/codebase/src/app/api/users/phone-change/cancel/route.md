# /api/users/phone-change/cancel

**File:** `src/app/api/users/phone-change/cancel/route.ts`
**Status:** Active (Settings PR-C)

## Purpose

Idempotently clears the caller's pending phone-change reservation. Called by the client when:
- The user closes the modal between `/initiate` and `updatePhoneNumber` (orphan pending cleanup).
- `updatePhoneNumber` fails with `auth/credential-already-in-use` (the new phone is linked to another account). Without this cleanup the orphan pending would block a retry with a different number for the 60s rate-limit window.

## Contract

`POST /api/users/phone-change/cancel`

Headers: `Authorization: Bearer <idToken>`

Body: empty.

Responses:
- `200 { success: true }` — pending deleted, or none existed (no-op).
- `401 / 403` — auth failure / session-epoch fenced out.
- `500 { success: false, error }` — Firestore delete raised.

## Behavior

- Self-serve only. Always targets `actor.uid`.
- The underlying `serverCancelPhoneChange` swallows "doc does not exist" — calling cancel without a pending doc is a 200, not a 404.
