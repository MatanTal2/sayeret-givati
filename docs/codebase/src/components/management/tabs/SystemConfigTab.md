# SystemConfigTab.tsx

**File:** `src/components/management/tabs/SystemConfigTab.tsx`
**Status:** Active (Phase 1 — Ammunition feature)

## Purpose

System-wide settings panel inside `/management`. Phase 1 adds the ammunition
notification recipient picker — the admin chooses one user who receives a copy
of every ammunition report submission (alongside the reporter's TL).

## State

| State | Type | Purpose |
|-------|------|---------|
| `recipient` | `UserSearchResult \| null` | Currently selected user in the picker |
| `hydratedFor` | `string \| null` | Memo key — last persisted recipient id we hydrated to avoid re-fetching the profile on every render |
| `saving` | `boolean` | Disables the save button while the request is in-flight |
| `toast` | `{ kind, message } \| null` | 3-second success/error chip next to the save button |

## Behavior

- Reads `systemConfig/main` via `useSystemConfig()`.
- After the config loads, calls `getUserProfile(persistedRecipientId)` once to
  hydrate the picker with the persisted user's display name + email.
- `UserSearchInput` is rendered read-only for non-admins (pointer-events none +
  opacity).
- Admin gate: `UserType.ADMIN || UserType.SYSTEM_MANAGER`. Server enforces the
  same check via `/api/system-config` PUT.
- Save button is disabled when nothing has changed (`recipient.uid` equals
  persisted id) or while saving.

## Removed (vs. previous placeholder)

The old mock fields — auto backup toggle, session timeout, max login attempts,
notification email, "system info" block, "perform backup now" / "reset
settings" buttons — were not persisted and not on the Phase 1 spec. They are
removed; reintroduce them with real backing if that work returns.

## Open

- The ammunition recipient is the only field today. Subsequent phases may add
  more system-wide flags (retention, default scopes). Each new field follows
  the same shape: extend `SystemConfig` + `validateSystemConfigPayload` + the
  hook + this UI.
