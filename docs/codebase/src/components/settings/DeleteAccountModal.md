# DeleteAccountModal.tsx

**File:** `src/components/settings/DeleteAccountModal.tsx`
**Status:** Active (Settings PR-G)

## Purpose

Danger-coloured modal that lets a signed-in user request soft-delete of their own account. Mounted by `/settings` and opened by the "מחק חשבון" button.

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Closes modal |
| `onSuccess` | `() => void` | Fires after successful deletion request — page wires to a success toast describing the 30-day cancel window |

## Flow

1. User clicks "מחק חשבון" — modal opens.
2. Password input + optional reason textarea (500 chars max).
3. Submit → client calls `reauthEmailPassword(password)` (Firebase step-up).
   - On `auth/wrong-password` or other re-auth error: surface mapped Hebrew message, stay on modal.
4. On re-auth success → `requestAccountDeletion(reason)` POSTs to `/api/users/account/delete`.
5. Three possible server responses:
   - **`success`** — modal calls `onSuccess()` and closes; page shows the cancel-window toast.
   - **`has_outstanding_assets`** — modal renders a per-category breakdown (equipment / ammo / open transfers) inside the existing form so the user knows what to return. Each row carries a "לדף" deep link (`/equipment` for equipment + transfers, `/ammunition` for ammo) that closes the modal on click. The error box at the bottom shows `DELETE_ACCOUNT_HAS_ASSETS`.
   - **`already_requested`** — modal shows `DELETE_ACCOUNT_ALREADY_REQUESTED`. (The cancel CTA for a pending deletion belongs in a separate future surface — out of PR-G scope.)

## Bilingual

All new strings live in `TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_*` with English mirrors in `TEXT_EN.SETTINGS.*` per `feedback_bilingual_text`.

## Status of follow-ups

- **Pending-deletion banner** — shipped on `feat/pr-g-banner-cancel-and-cron` (`src/components/settings/PendingDeletionBanner.tsx`, mounted in `AppShell`).
- **Cancel-pending-deletion in Settings** — shipped on the same branch. The danger row at the bottom of `/settings` swaps the delete button for a "בטל בקשת מחיקה" button when `enhancedUser.deletionRequestedAt` is set.
- **Outstanding-assets shortcut links** — shipped on the same branch (rows now link to `/equipment` / `/ammunition`).
- **Hard-delete cron** — still deferred. Needs Council on cross-system safety + Vercel cron config.
