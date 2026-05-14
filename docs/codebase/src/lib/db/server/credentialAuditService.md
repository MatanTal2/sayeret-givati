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
- `serverPurgeCredentialAuditLog(opts)` — paged retention sweep. Deletes entries whose `timestamp` is older than `opts.ageDays ?? CREDENTIAL_AUDIT_RETENTION_DAYS`. Pages 500 docs per batch (Firestore commit limit). Hard cap via `opts.maxDeletes` (default 5000) — runs that hit the cap return `truncated: true` so the next tick resumes from the same cutoff. `opts.dryRun` examines without writing. Bails out on a batch commit failure rather than retrying the same broken page — `failed` is non-zero on the response and the next tick retries.
- `CREDENTIAL_AUDIT_RETENTION_DAYS = 365` — Council answer Q5=a (PR-C).

## Tests

- `credentialAuditService.test.ts` — write shape (server timestamp, optional-field gating, empty-metadata drop) + list scoping/ordering/limit (10 cases).
- `credentialAuditServicePurge.test.ts` — purge paged delete, multi-page iteration, dry-run, maxDeletes cap with `truncated`, batch-failure bail-out, cutoff math (8 cases).

## Related

- Write surface: `src/app/api/auth/audit/route.ts`.
- Read surface: `src/components/settings/AccountActivitySection.tsx` via `GET /api/auth/audit`.
- Client wrapper: `src/lib/credentialAuditClient.ts`.
- Scheduled retention: `src/app/api/cron/purge-credential-audit-log/route.ts` (03:30 UTC daily via `vercel.json`).
- Operator-callable retention: `scripts/purge-credential-audit-log.js`.
- Settings PR plan: `project_settings_page.md` PR-D + PR-C Council Q5.
