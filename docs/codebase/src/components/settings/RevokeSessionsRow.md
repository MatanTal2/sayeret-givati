# RevokeSessionsRow.tsx

**File:** `src/components/settings/RevokeSessionsRow.tsx`
**Status:** Active (Settings — Sign Out Other Devices)

## Purpose

Renders the "Sign out other devices" affordance inside the Account Security section of the Settings page. Calling the action ends every other session on the user's account while keeping the current device signed in.

## Flow

1. User clicks the row's primary button → Headless UI `Dialog` confirm modal opens.
2. Confirm → `revokeOtherSessions()` (`src/lib/sessionsClient.ts`) hits `POST /api/users/sessions/revoke`.
3. Server bumps `users.sessionEpoch` to this device's `auth_time` (ms) and writes a `SESSIONS_REVOKED` audit row.
4. Toast via `useToast` reports success or the server's error.

Other devices die on their next API request when `getActorFromRequest` rejects them with the `Session invalidated by a security event` error.

## Bilingual

All visible strings under `TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_*` (Hebrew) with `TEXT_EN` mirrors. The confirm modal title, body, submit, cancel, success, and error messages are all keyed.

## Related

- API: `docs/codebase/src/app/api/users/sessions/revoke/route.md`
- Client wrapper: `src/lib/sessionsClient.ts`
- Audit surface: `docs/codebase/src/components/settings/AccountActivitySection.md` (where the resulting `SESSIONS_REVOKED` row appears)
- Settings rollout: `project_settings_page.md`
