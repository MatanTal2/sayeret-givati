# /api/users/account/delete

**File:** `src/app/api/users/account/delete/route.ts`
**Status:** Active (Settings PR-G)

## Purpose

Self-serve soft-delete request. Stamps `deletionRequestedAt` on the caller's user doc and writes a credential-audit row. Firebase Auth user is NOT touched here — that happens in the future hard-delete pass at `deletionRequestedAt + 30d`.

## Contract

`POST /api/users/account/delete`

Headers: `Authorization: Bearer <idToken>`

Body:
```json
{ "reason": "leaving unit" }
```
(`reason` optional; trimmed + capped at 500 chars server-side.)

Responses:
- `200 { success: true }` — soft-delete recorded.
- `400 { success: false, code: 'has_outstanding_assets', outstanding: { equipmentCount, ammunitionUserHoldings, pendingTransferRequests } }` — pre-flight blocked. Counts let the client tell the user exactly what to return.
- `400 { success: false, code: 'already_requested' }` — a prior deletion request is still pending.
- `401 / 403` — bearer missing / invalid / session-epoch fenced out.

## Pre-flight check

Calls `countOutstandingAssetsForUser(uid)`. Any non-zero count throws `AccountDeletionHasAssetsError` carrying the breakdown, which the route maps to a 400. Council Q3=a — **block, never auto-retire**. The user must clean up first.

## Re-auth model

The route does NOT verify password re-auth on the server. The sessionEpoch fence in `getActorFromRequest` (set by phone-change confirm) is the server-side cut. Password re-auth is a client-side UX step-up: `DeleteAccountModal` calls `reauthEmailPassword(password)` before hitting this endpoint so the user can't accidentally delete from a logged-in-but-unattended browser.

## Audit

After the soft-delete commits, the route writes a `ACCOUNT_DELETION_REQUESTED` row to `credentialAuditLog` with IP + UA captured server-side and `metadata: { reason }` when supplied. Audit failure is logged but does NOT roll back the soft-delete — the user's primary action wins.
