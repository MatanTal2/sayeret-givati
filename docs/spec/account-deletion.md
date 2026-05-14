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

## PR-G follow-ups

### Shipped on `feat/pr-g-banner-cancel-and-cron` (2026-05-14)

- **Pending-deletion banner** — `src/components/settings/PendingDeletionBanner.tsx`. Mounted in `AppShell` between `TopBar` and the main layout. Reads `enhancedUser.deletionRequestedAt` from `AuthContext`; renders nothing when unset. Shows days remaining via `computeDaysLeft` + one-click cancel button that calls `cancelAccountDeletion` and refreshes the enhanced user. Banner disappears in-place on success.
- **Cancel-deletion UI in Settings** — when `enhancedUser.deletionRequestedAt` is set, the danger row at the bottom of `/settings` swaps "מחק חשבון" for "בטל בקשת מחיקה" (uses the same `cancelAccountDeletion` client). Title + description swap to the pending-state copy with the days-remaining count.
- **`FirestoreUserProfile` + `EnhancedAuthUser`** — both gained the optional `deletionRequestedAt: Timestamp` field, surfaced through both `AuthContext` write sites (onAuthStateChanged initial load + `refreshEnhancedUser`).
- **Outstanding-assets shortcut links** — `DeleteAccountModal`'s blocked-by-assets breakdown now renders each row as a Headless UI–free `<Link>` to `/equipment` (equipment + transfers) or `/ammunition`. Clicking dismisses the modal so the user lands on the asset page directly.

### Shipped on `feat/account-deletion-cron` (2026-05-14)

- **Hard-delete sweep service** — `serverSweepAccountDeletions({ dryRun, batchLimit, onlyUid? })` in `src/lib/db/server/accountDeletionService.ts`. Iterates `users.deletionRequestedAt < now-30d`, per-uid try/catch with aggregate result. Order: stamp `deletionStartedAt` (resume sentinel) → `Auth.deleteUser` (swallows `auth/user-not-found`) → Firestore tombstone (`deletedAt`, `displayName='Deleted User'`, scrub `email/phoneNumber/profileImage/address/communicationPreferences/firstName/lastName`) → `writeCredentialAuditEvent('ACCOUNT_DELETED')`. Audit-write failures are logged but do not fail the candidate (the delete is irreversible).
- **Cron route** `POST /api/cron/sweep-account-deletions` — gated by `Authorization: Bearer ${CRON_SECRET}` via timing-safe equality. Refuses with 503 outside the prod project (`NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'sayeret-givati-1983'`). Query flags: `?dryRun=true`, `?limit=N` (1..100, default 25).
- **Operator script** `scripts/sweep-account-deletions.js` — plain Node (mirrors `backfill-phone-book.js`). Flags: `--dry-run`, `--limit N`, `--uid <uid>`. Refuses to run outside prod project ID.
- **`vercel.json`** — daily 03:00 UTC cron at `/api/cron/sweep-account-deletions`.
- **Idempotency**: filter (`deletionRequestedAt < cutoff`) + client-side `deletedAt != null` skip + the `auth/user-not-found` swallow on Auth.deleteUser → a re-run after a partial failure resumes cleanly without double-deleting.
- **Asset re-check**: `countOutstandingAssetsForUser` runs per-candidate inside the sweep. If the user re-acquired equipment/ammo during the retention window the sweep skips them (does NOT auto-retire). Matches Q3=a from the original scoping.
- **Tests**: 9 new sweep tests covering all skip reasons, dry-run, happy path, `auth/user-not-found` swallow, non-recoverable Auth error, audit-write tolerance. Mocks `getAdminAuth().deleteUser` + `writeCredentialAuditEvent` directly.

### Operator runbook (first activation)

1. Generate the secret: `openssl rand -hex 32` → store in Vercel project env as `CRON_SECRET` (production only).
2. Dry-run via script locally to inspect candidates: `node scripts/sweep-account-deletions.js --dry-run`.
3. Canary one real delete: `node scripts/sweep-account-deletions.js --uid <known-eligible-uid> --limit 1`.
4. Flip cron on by merging this branch — Vercel picks up `vercel.json` and schedules the first tick at 03:00 UTC.
5. Watch the first scheduled run in Vercel function logs (`[cron/sweep] candidate` + `[cron/sweep] done`).

### Still deferred

- **Slack / email alert** when `result.errors.length > 0`. Out of scope for this PR; route logs surface in Vercel Functions log already.
- **Admin force-delete endpoint** if/when Q4 reopens.
