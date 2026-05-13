# /api/users/account/cancel-delete

**File:** `src/app/api/users/account/cancel-delete/route.ts`
**Status:** Active (Settings PR-G)

## Purpose

Idempotent cancel of a pending account-deletion request, callable any time inside the 30-day retention window. Clears `deletionRequestedAt` and `deletionReason` from the user doc.

## Contract

`POST /api/users/account/cancel-delete`

Headers: `Authorization: Bearer <idToken>`

Body: empty.

Responses:
- `200 { success: true }` — pending request cleared, `ACCOUNT_DELETION_CANCELLED` audit row written.
- `400 { code: 'no_pending_request' }` — no active deletion to cancel.
- `401 / 403` — auth.

Self-serve only.
