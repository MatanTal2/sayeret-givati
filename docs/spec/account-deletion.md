# Account deletion (Settings PR-G)

**Status:** Implemented 2026-05-13 on `feat/settings-account-deletion`.

Settings PR-G — self-serve account deletion with soft-delete + 30-day retention.

## Locked answers (from `project_settings_pr_g`)

| Q | Choice | Drives |
|---|--------|--------|
| Q1 | 30-day retention | `ACCOUNT_DELETION_RETENTION_DAYS = 30` constant + hard-delete cron picks at `deletionRequestedAt + 30d` |
| Q2 | Soft tombstone everywhere | `users` doc kept on hard-delete with `displayName → "Deleted User"`; Auth user deleted. Equipment / ammo history shows historical name |
| Q3 | Pre-flight BLOCK | Outstanding equipment / ammo / pending transfers reject the delete with `code: has_outstanding_assets` |
| Q4 | Self only | No admin override in PR-G. Caller's `actor.uid` is the only target |
| Q5 | Password re-auth | Client step-up via `reauthEmailPassword`; server trusts `getActorFromRequest`'s sessionEpoch fence |
| Q6 | — | N/A given Q4 |

## API surface

### `POST /api/users/account/delete`

Self-serve soft-delete request.

Body: `{ reason?: string }` (free-text, max 500 chars, optional).

Responses:
- `200 { success: true }` — stamps `users/{uid}.deletionRequestedAt` + writes `ACCOUNT_DELETION_REQUESTED` audit row.
- `400 { code: 'has_outstanding_assets', outstanding: { equipmentCount, ammunitionUserHoldings, pendingTransferRequests } }` — pre-flight blocked. Client renders the breakdown in the modal so the user knows what to return.
- `400 { code: 'already_requested' }` — deletion already pending for this uid.
- `401 / 403` — auth.

### `POST /api/users/account/cancel-delete`

Idempotent cancel within the retention window.

Responses:
- `200 { success: true }` — clears `deletionRequestedAt` + `deletionReason`, writes `ACCOUNT_DELETION_CANCELLED` audit row.
- `400 { code: 'no_pending_request' }` — nothing to cancel.

## Pre-flight asset check

`countOutstandingAssetsForUser(uid)` issues 5 parallel Firestore queries:

| Collection | Filter |
|-----------|--------|
| `equipment` | `currentHolderId == uid` AND `status != retired` |
| `ammunition` | `currentHolderType == 'USER'` AND `currentHolderId == uid` |
| `ammunitionInventory` | `holderType == 'USER'` AND `holderId == uid` |
| `transferRequests` | `fromUserId == uid` AND `status == pending` |
| `transferRequests` | `toUserId == uid` AND `status == pending` |

Returns `{ equipmentCount, ammunitionUserHoldings, pendingTransferRequests }`. Any non-zero count blocks the delete request.

## Why no Auth-user deletion in PR-G

PR-G is *soft-delete request only*. The Firebase Auth user, the `users` Firestore doc, the `displayName` rewrite, and audit-FK tombstoning all live in the hard-delete pass that runs at `deletionRequestedAt + 30d`. That hard-delete path will be a separate operator-callable script (then automated as a Cloud Function / Cloud Scheduler job). Reasons for the split:

- Operators want a manual sweep first to verify scope before automating.
- Sliding the line lets users cancel cleanly inside the window without race conditions.
- Hard-delete touches Auth (admin SDK `auth.deleteUser`) — that's an irreversible cross-system write and deserves its own audit + canary deployment.

## Audit events (extends `CredentialAuditEventType`)

| Event | Fired when |
|-------|-----------|
| `ACCOUNT_DELETION_REQUESTED` | `/delete` succeeds. Metadata carries `{ reason }` when supplied. |
| `ACCOUNT_DELETION_CANCELLED` | `/cancel-delete` succeeds. |
| `ACCOUNT_DELETED` | Hard-delete pass (future PR). |

All three added to the `ALLOWED_EVENT_TYPES` allowlist in `/api/auth/audit`.

## Client surfaces

- `src/components/settings/DeleteAccountModal.tsx` — danger-coloured Headless UI dialog. Password input (always required), reason textarea (optional, 500 chars), submit button. Re-auth runs first; on success, posts to `/delete`. If server returns `has_outstanding_assets`, the modal renders the breakdown inline rather than closing — user fixes inventory, retries.
- `src/app/settings/page.tsx` — the previously-disabled "מחק חשבון" button is now enabled and opens the modal. Success toast uses `DELETE_ACCOUNT_SUCCESS` text (Hebrew + English).

## Out of PR-G (follow-ups)

- **Hard-delete script** at `deletionRequestedAt + 30d` — manual first run, then a cron. Auth user delete + `users.displayName` → "Deleted User" + `users.deletedAt` stamp.
- **Pending-deletion banner** on the global app shell: "החשבון שלך מתוזמן למחיקה ב-X. בטל?" with a one-click cancel CTA. Surface visibility for the user mid-window.
- **Outstanding-assets shortcut links** in the modal — "Return equipment" / "Cancel pending transfers" deep links rather than the user manually navigating.
- **Hard-delete audit row** with the `ACCOUNT_DELETED` event already in the allowlist.
- **Admin force-delete endpoint** if/when Q4 reopens.
