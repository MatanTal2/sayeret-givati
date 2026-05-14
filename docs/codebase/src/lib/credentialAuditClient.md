# credentialAuditClient.ts

**File:** `src/lib/credentialAuditClient.ts`
**Status:** Active (Settings PR-D + Account Activity follow-up)

## Purpose

Browser-side wrapper for the credential audit API. Two exports:

| Export | Direction | Error policy |
|--------|-----------|--------------|
| `logCredentialAuditEvent(args)` | POST `/api/auth/audit` | Fire-and-forget; logs failures via `console.warn` so audit never blocks the primary action. |
| `fetchCredentialAuditLog({ uid?, limit? })` | GET `/api/auth/audit` | Throws on failure; the UI surfaces a retry. |

Both go through `apiFetch` so the bearer token is attached automatically.

## fetchCredentialAuditLog

Returns `CredentialAuditEntryWithId[]` (newest-first). With no args, scopes to the caller. Elevated callers (ADMIN / SYSTEM_MANAGER) may pass `uid` to read another user's log. `limit` defaults to the server's value (25) and is clamped server-side to 100.

## Consumers

- `src/components/settings/AccountActivitySection.tsx` — drives the Account Activity disclosure on the Settings page.
- `src/components/settings/ChangePasswordModal.tsx` → `logCredentialAuditEvent({ eventType: 'PASSWORD_CHANGED' })` on success.
- PR-C phone-change confirm route writes `PHONE_CHANGED` server-side directly (no client log).
- PR-G account deletion writes `ACCOUNT_DELETION_*` server-side directly.

## Related

- Route: `docs/codebase/src/app/api/auth/audit/route.md`
- Service: `src/lib/db/server/credentialAuditService.ts`
- Type: `src/types/credentialAudit.ts`
