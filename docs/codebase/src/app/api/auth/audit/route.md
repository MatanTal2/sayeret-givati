# /api/auth/audit

**File:** `src/app/api/auth/audit/route.ts`
**Status:** Active (Settings PR-D + Account Activity follow-up)

## Purpose

Entry point for the credential audit log. POST appends an event; GET reads recent events. Both are backed by `credentialAuditService.ts` (admin SDK; client reads are denied at the Firestore rules layer).

# POST /api/auth/audit

Logs a credential-change event to `credentialAuditLog`. Backed by `writeCredentialAuditEvent` in `credentialAuditService.ts`.

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

# GET /api/auth/audit

Returns recent audit entries for the caller (default) or any user (when elevated). Backed by `listCredentialAuditForUser`.

## Request

```
GET /api/auth/audit?uid=<uid>&limit=<n>
Authorization: Bearer <idToken>
```

Both query params are optional. `uid` defaults to the actor; `limit` defaults to 25 and is clamped server-side to a max of 100. Response shape:

```
{ success: true, entries: Array<CredentialAuditEntry & { id: string }> }
```

Entries include `ip` and `userAgent` so the user can recognise unfamiliar devices in the Account Activity section. Plaintext old/new phone numbers are never returned — only SHA-256 hashes via `metadata`.

## Authorization

- Bearer token required via `getActorOrError`.
- Caller reads their OWN audit log by default.
- ADMIN / SYSTEM_MANAGER may pass `?uid=<other>` to read another user's log.
- Non-elevated cross-uid → 403.

## Failure modes

- 400 — `limit` is not a positive integer.
- 401 — missing or invalid bearer token.
- 403 — caller is not the target and not elevated.
- 500 — read failure.

## Related

- Service: `src/lib/db/server/credentialAuditService.ts`
- Client wrapper: `src/lib/credentialAuditClient.ts` (`logCredentialAuditEvent` + `fetchCredentialAuditLog`)
- UI surface: `src/components/settings/AccountActivitySection.tsx`
- Settings PR plan: `project_settings_page.md` PR-D.
