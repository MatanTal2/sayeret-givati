# WelcomeModal.tsx

**File:** `src/components/onboarding/WelcomeModal.tsx`
**Status:** Active

## Purpose

Mandatory post-registration onboarding modal. Surfaces whenever an authenticated user has no `teamId` — a required field for team-scoped equipment queries. Cannot be dismissed; user must save a team to proceed.

Rendered conditionally by `AppShell`. Suppressed on `/admin/*` so admins can populate the teams list in System Config.

## Behavior

- Reads available teams from `useSystemConfig()` (`admin_config/system_admin.teams`).
- Single required field: team picker. Profile image upload lives on the profile page, not here.
- Renders `/public/platon-d-logo.png` at the top of the card via `next/image` (`h-20 w-auto mx-auto`). Native asset is 2944×1440; class scales it to ~80px tall (~163px wide), well inside the `max-w-md` (448px) modal.
- On save, calls `updateUserProfile(uid, { teamId })` then `refreshEnhancedUser()`. Modal auto-unmounts once `teamId` is populated on `enhancedUser`.
- Disables the team `<select>` and submit button while teams are loading or the teams list is empty.
- Locks page scroll via `useScrollLock(true)` while mounted.

## Layout

- Wrapper uses `modal-overlay flex items-center justify-center p-4` so the dialog is centered on every viewport (the `modal-overlay` class itself is just the fixed full-screen backdrop — flex centering must be added at the call site, matching the convention used by `AnnouncementsWidget` and `MediaWidget`).
- Card: `bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8`.

## Adding teams

The modal does not expose a way to create teams. Teams are managed by admins at `/admin` → "⚙️ הגדרות מערכת" tab (`SystemConfigPanel`), which writes to `admin_config/system_admin.teams` via `PUT /api/system-config`.
