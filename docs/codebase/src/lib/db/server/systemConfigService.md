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
| `validateSystemConfigPayload` | Pure validator — rejects non-object, type-checks `ammoNotificationRecipientUserId` / `teams` / `roundOpen`. |

## Fields

| Field | Type | Purpose |
|-------|------|---------|
| `ammoNotificationRecipientUserId` | `string` | Additional fan-out target for ammunition reports. Empty = no extra recipient. |
| `teams` | `string[]` | Canonical team list. Dedup/trim on validate. |
| `roundOpen` | `boolean` | Gates pull-from-storage on `equipment` items in `STORED` status. When false (or unset), `serverPullFromStorage` throws. Toggled from `SystemConfigTab.tsx`. |

## Firebase Operations

- `systemConfig/main` — `get`, `set` (merge).

## Notes

- Doc id is hardcoded to `main` — there is exactly one system-config document.
- Caller (API route) is responsible for the admin gate; the service trusts its
  caller. Permission check lives in `src/app/api/system-config/route.ts`; the
  route accepts ADMIN / SYSTEM_MANAGER / MANAGER for `PUT`.
- Empty string for `ammoNotificationRecipientUserId` is the "cleared" state and
  is valid. Phase 4's notification fan-out treats empty/missing as "no extra
  recipient" and skips the manager fan-out.
