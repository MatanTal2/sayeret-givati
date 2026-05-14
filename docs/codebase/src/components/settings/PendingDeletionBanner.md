# PendingDeletionBanner.tsx

**File:** `src/components/settings/PendingDeletionBanner.tsx`
**Status:** Active (PR-G follow-up)

## Purpose

Top-of-app banner shown while the signed-in user has a soft-delete request in flight. Displays days remaining until the 30-day retention window expires and exposes a one-click "cancel deletion" button.

Mounted in `AppShell` between `TopBar` and the main layout. Renders `null` when `enhancedUser.deletionRequestedAt` is unset, so the banner never appears for users who didn't request deletion.

## Wiring

- Reads `enhancedUser.deletionRequestedAt` from `AuthContext`.
- Calls `cancelAccountDeletion` from `src/lib/accountDeletionClient.ts` → `POST /api/users/account/cancel-delete`.
- On success or `no_pending_request`, calls `refreshEnhancedUser()` so the banner disappears in-place without a hard refresh.
- Uses the project `useToast()` for success / info / error feedback. Tone names follow Toast's `ToastTone` (`info | success | warning | danger`).

## `computeDaysLeft` helper

Exported separately from the component so the Settings page can reuse it for the "in 9 days" message on the delete-account row. Floors to 0 — the message never reports a negative remaining-days count when the hard-delete cron is late.

## Visual

`bg-danger-50 border-b border-danger-200 text-danger-900` keeps the banner aligned with the existing destructive vocabulary (matches `DeleteAccountModal`).
