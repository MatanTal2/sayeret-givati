# db/server/systemConfigService.ts

**File:** `src/lib/db/server/systemConfigService.ts`
**Status:** Active (Phase 1 — Ammunition feature)

## Purpose

Admin-SDK read/write for the single doc `systemConfig/main`. System-wide flags
that are not per-user. Currently exposes the ammunition notification recipient;
will gain more fields as the Ammunition feature lands.

## Exports

| Export | Purpose |
|--------|---------|
| `serverGetSystemConfig` | Returns the `main` doc or `null` if it doesn't exist yet. |
| `serverUpdateSystemConfig` | `set(..., { merge: true })` on `main`. Stamps `updatedAt` (server timestamp) + `updatedBy`. |
| `validateSystemConfigPayload` | Pure validator — rejects non-object, type-checks `ammoNotificationRecipientUserId`, coerces null/undefined/'' to empty string for clearing. |

## Firebase Operations

- `systemConfig/main` — `get`, `set` (merge).

## Notes

- Doc id is hardcoded to `main` — there is exactly one system-config document.
- Caller (API route) is responsible for the admin gate; the service trusts its
  caller. Permission check lives in `src/app/api/system-config/route.ts`.
- Empty string for `ammoNotificationRecipientUserId` is the "cleared" state and
  is valid. Phase 4's notification fan-out treats empty/missing as "no extra
  recipient" and skips the manager fan-out.
