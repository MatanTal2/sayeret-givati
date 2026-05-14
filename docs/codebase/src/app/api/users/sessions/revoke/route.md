# POST /api/users/sessions/revoke

**File:** `src/app/api/users/sessions/revoke/route.ts`
**Status:** Active (Settings — Sign Out Other Devices)

## Purpose

Lets a signed-in user end every OTHER session on their account while the calling device stays alive. Backed by the existing `users.sessionEpoch` fence — bumping it kills every device whose token was minted earlier.

## Request

```
POST /api/users/sessions/revoke
Authorization: Bearer <idToken>
```

No body.

## Response

```
{ success: true, sessionEpochMs: number }
```

`sessionEpochMs` is the millisecond timestamp written to `users.sessionEpoch` — equal to the calling token's `auth_time` claim, in ms. Other devices fail `getActorFromRequest`'s fence on their next API hit.

## Authorization

- Bearer token required via `getActorOrError`.
- Self-only — the route always operates on `actor.uid`. No admin force-logout path here.

## Failure modes

- 400 — token decoded fine but `auth_time` claim is missing or zero.
- 401 — missing bearer; invalid / expired token.
- 500 — Firestore write failure.

## Side effects

- Updates `users/{uid}.sessionEpoch` (existing field, also bumped by `/api/users/phone-change/confirm`).
- Writes `SESSIONS_REVOKED` row to `credentialAuditLog` (IP + UA captured server-side). Audit write is fire-and-forget — failure is logged but does not fail the route response.

## Related

- Fence enforcement: `src/lib/db/server/auth.ts` (`getActorFromRequest`).
- UI: `src/components/settings/RevokeSessionsRow.tsx`.
- Client wrapper: `src/lib/sessionsClient.ts`.
- Settings rollout: `project_settings_page.md`.
