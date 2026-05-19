# SystemConfigPanel.tsx

**File:** `src/app/admin/components/SystemConfigPanel.tsx`
**Status:** Active

## Purpose

The `/admin` System Config panel. Owns the **teams allowlist** — the list of
team names the registration flow validates against. Identity boundary; lives
on `/admin` per `docs/spec/settings-ownership.md`.

## Scope (post settings-split)

| Setting | Owned here? |
|---|---|
| `systemConfig.teams` | yes |
| `systemConfig.ammoNotificationRecipientUserIds` | **no** — moved to `/management` |
| `systemConfig.roundOpen` | **no** — lives on `/management` |

The ammo recipient editor used to live here too. It was removed when the
field shape changed from a single uid (`ammoNotificationRecipientUserId:
string`) to an array (`ammoNotificationRecipientUserIds: string[]`) and the
operational ownership moved to `/management` (where managers can edit it
themselves). The teams allowlist stays here because it's an identity
boundary that ADMIN / SYSTEM_MANAGER own.

## State

| State | Type | Purpose |
|-------|------|---------|
| `teams` | `string[]` | Pending edit copy of the teams list |
| `newTeam` | `string` | Input for the "add team" textbox |
| `saving` | `boolean` | Disables Save while the request is in flight |
| `feedback` | `{ kind, text } \| null` | Inline success/error message |

## Behavior

- Reads/saves via `useSystemConfig()` (the same hook the management surface
  uses).
- Add: trims input, rejects duplicates, appends to local `teams`. Save sends
  the array through the server validator.
- Remove: filters by name from local `teams` only; persist on Save.
- Server enforces the admin gate on the API route — this panel only renders
  inside the existing `/admin` admin-gated layout.
