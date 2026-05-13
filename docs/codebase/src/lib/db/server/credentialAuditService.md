# credentialAuditService.ts

**File:** `src/lib/db/server/credentialAuditService.ts`
**Status:** Active (Settings PR-D)

## Purpose

Server-side service for the credential audit trail. Distinct from `actionsLog` (equipment / ammo / template domain mutations). Credential events touch identity primitives — password, phone, email, refresh-token revocation — and need their own audit surface for security review without polluting the equipment-centric `actionsLog` schema.

## Collection

`credentialAuditLog` (constant: `COLLECTIONS.CREDENTIAL_AUDIT_LOG`).

Firestore rules deny **all** client access (read AND write). Every operation goes through this service via an API route.

## Document shape

See `src/types/credentialAudit.ts`. Fields:

- `uid` — target user
- `actorUid` — who performed the change (usually === uid; differs for admin force-reset)
- `actorUserType` — frozen at write time so a later role demotion can't rewrite history
- `eventType` — one of `PASSWORD_CHANGED` / `PHONE_CHANGED` / `EMAIL_CHANGED` / `PHONE_FORCE_RESET` / `SESSIONS_REVOKED`
- `timestamp` — server timestamp set at write
- `ip?` — best-effort first-hop from `x-forwarded-for` or `x-real-ip`
- `userAgent?` — from the request `User-Agent` header
- `metadata?` — opt-in event-specific payload (e.g. `{ oldNumberHash, newNumberHash }` for `PHONE_CHANGED` — NEVER plaintext)

The document is append-only — no update or delete path exists in this codebase.

## API

- `writeCredentialAuditEvent(args)` — appends one entry; returns the generated doc id. Optional fields are omitted from the document when not supplied (and `metadata` is dropped when an empty object is passed).
- `listCredentialAuditForUser(uid, limit = 50)` — newest-first, scoped to a single target user. Caller-elevation enforcement is the API route's job — this service trusts its caller.

## Tests

`src/lib/db/server/__tests__/credentialAuditService.test.ts` covers:
- Minimal write shape (server timestamp, no optional fields leak).
- IP + User-Agent included when supplied.
- Empty `metadata` object dropped.
- Non-empty `metadata` preserved.
- List scopes by uid, orders descending on `timestamp`, applies default + custom limits.

## Related

- API route: `src/app/api/auth/audit/route.ts`.
- Client wrapper: `src/lib/credentialAuditClient.ts`.
- Settings PR plan: `project_settings_page.md` PR-D.
