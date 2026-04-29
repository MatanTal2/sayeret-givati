# /api/permission-grants

Bearer-token-gated CRUD for `permissionGrants/{grantId}`. Issuance and
revocation are restricted to ADMIN + SYSTEM_MANAGER; everyone is denied at
401 if they reach the route without a verified token.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/permission-grants?status=&userId=&includeExpired=` | List grants newest first (max 200). ADMIN/SM only. |
| `POST` | `/api/permission-grants` | Issue a new grant (delegates to `serverIssueGrant`). |
| `POST` | `/api/permission-grants/{id}/revoke` | Revoke an active grant (delegates to `serverRevokeGrant`). |

## Request shapes

### POST /api/permission-grants
```ts
{
  userId: string;
  userDisplayName?: string;
  grantedRole: 'team_leader' | 'manager' | 'system_manager';
  scope: 'all' | 'team';
  scopeTeamId?: string;       // required when scope === 'team'
  durationMs?: number;        // OR
  expiresAtMs?: number;       // exact epoch ms
  reason: string;
}
```

Returns `{ success: true, id }` or a `GrantValidationError`-mapped 4xx.

### POST /api/permission-grants/{id}/revoke
Optional body `{ reason?: string }`. Returns `{ success: true }`.

## Auth

All three routes use `getActorOrError(request)` — bearer token required. The
service layer enforces the ADMIN/SM gate and returns 403 from inside
`GrantValidationError` for non-issuers; the GET route additionally checks
`isGrantIssuer` itself before listing.

## Error mapping

`GrantValidationError` carries a numeric `status` (400 for input issues, 403
for authorization issues). Both routes catch it and return `NextResponse.json`
with that status. Anything else falls through to a 500.
