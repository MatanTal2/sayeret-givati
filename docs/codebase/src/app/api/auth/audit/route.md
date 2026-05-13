# POST /api/auth/audit

**File:** `src/app/api/auth/audit/route.ts`
**Status:** Active (Settings PR-D)

## Purpose

Single entry point for clients to log a credential-change event to `credentialAuditLog`. Backed by `writeCredentialAuditEvent` in `credentialAuditService.ts`.

## Request

```
POST /api/auth/audit
Authorization: Bearer <idToken>
Body: { uid: string, eventType: CredentialAuditEventType, metadata?: object }
```

`CredentialAuditEventType` is one of: `PASSWORD_CHANGED`, `PHONE_CHANGED`, `EMAIL_CHANGED`, `PHONE_FORCE_RESET`, `SESSIONS_REVOKED`. Any other value → 400.

## Authorization

- Bearer token required via `getActorOrError`.
- Caller may log against their OWN uid.
- ADMIN / SYSTEM_MANAGER may log against any uid (used by force-reset and admin-override flows).
- Other actor / target combinations → 403.

## Capture

The route captures IP + User-Agent from the request headers — the client cannot forge them. IP comes from `x-forwarded-for` (first hop) or `x-real-ip`; either may be absent in dev and the field is then omitted from the doc.

## Failure modes

- 400 — missing `uid`, missing/invalid `eventType`, malformed `metadata`.
- 401 — missing or invalid bearer token (from `getActorOrError`).
- 403 — caller is not the target and not elevated.
- 500 — write failure.

## Related

- Service: `src/lib/db/server/credentialAuditService.ts`
- Client wrapper: `src/lib/credentialAuditClient.ts`
- Settings PR plan: `project_settings_page.md` PR-D.
