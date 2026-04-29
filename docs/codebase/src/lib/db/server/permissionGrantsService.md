# db/server/permissionGrantsService.ts

**File:** `src/lib/db/server/permissionGrantsService.ts`
**Status:** Active

## Purpose

Server-side persistence and lifecycle for time-limited permission grants. A
grant elevates a single user's effective role within a scope (a single team or
all teams) until a hard expiry. Issuance is gated to ADMIN and SYSTEM_MANAGER;
duration is capped at 7 days. The active-grant loader is consumed by
`auth.getActorFromRequest` to make the verified `ApiActor` grant-aware before
policy checks run.

## Exports

| Export | Purpose |
|--------|---------|
| `getActiveGrants(uid)` | Returns active, non-expired grants for one user — drives `equipmentPolicy` elevation. |
| `serverIssueGrant(input)` | Validates issuer, role, scope, reason, and duration; persists a new grant; notifies the grantee. Throws `GrantValidationError`. |
| `serverRevokeGrant(input)` | Flips status to `revoked` and stamps `revokedBy/revokedAtMs/revokeReason`. ADMIN+SM only. |
| `serverListGrants(filter)` | Admin list endpoint backing — newest first, up to 200 records, with computed `isExpired` flag. |
| `isGrantIssuer(userType)` | Boolean classifier: ADMIN or SYSTEM_MANAGER only. |
| `GrantValidationError` | Named error with `status` (400 or 403) for API routes to map cleanly. |

## Firebase Operations

- `permissionGrants/{grantId}` — `set` on issue, `update` on revoke, `where`-filtered queries on read/list.
- `notifications` — one create per issued grant (failures are swallowed; the grant write is the source of truth).

## Validation rules baked into `serverIssueGrant`

- Issuer must be ADMIN or SYSTEM_MANAGER.
- Issuer cannot grant a role to themselves.
- `grantedRole` must be one of TEAM_LEADER, MANAGER, SYSTEM_MANAGER. ADMIN bumps are not allowed via grants.
- `scope === 'team'` requires `scopeTeamId`; `scope === 'all'` requires the issuer be ADMIN.
- `reason` is required (trimmed, non-empty).
- `expiresAtMs` must be a future timestamp at most 7 days out.
- An overlapping active grant for the same user + role + scope is rejected (idempotent UX — no silent duplicates).

## Notes

- Audit fields live on the grant doc itself (`issuedBy/issuedAtMs/revokedBy/revokedAtMs/revokeReason`). There is **no** `actionsLog` entry — `actionsLog` is equipment-coupled.
- `expiresAtMs` is epoch milliseconds (not Firestore Timestamp) so the policy layer can use it on both client and server without mismatched Timestamp types.
- "Expired" status is computed at read time by comparing `expiresAtMs` to `Date.now()`. The stored `status` only flips from `active` to `revoked` via `serverRevokeGrant`.
- `getActiveGrants('')` returns `[]` defensively — the caller in `auth.ts` always passes a verified uid, but the cheap guard saves a Firestore round-trip if anything ever changes.
