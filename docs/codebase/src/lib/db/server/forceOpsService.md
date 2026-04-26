# db/server/forceOpsService.ts

**File:** `src/lib/db/server/forceOpsService.ts`
**Status:** Active (Phase 4)

## Purpose

Admin-SDK privileged override: changes holder, signer, or both on one or more equipment items atomically. Only reachable via `/api/force-ops` (no client wrapper in `src/lib/`).

## Exports

| Export | Purpose |
|--------|---------|
| `serverForceOps` | Transactional bulk reassignment. Kinds: `holder`, `signer`, `both`. Denormalized `holderTeamId/UnitId` and/or `signerTeamId/UnitId` are updated from the target user's profile in the same transaction. Writes N action logs (`FORCE_TRANSFER_HOLDER` or `FORCE_TRANSFER_SIGNER`). Notifies every displaced party (`force_transfer_executed` / `force_signer_changed`). |

## Enforcement

- API route (`/api/force-ops`) runs `equipmentPolicy.canForceTransfer` per item before calling this function. TL is scoped to their team; manager+ is unrestricted.
- Reason is **required** and written to every action log note.

## Firebase Operations

- `users` — `get` (once, for target profile)
- `equipment` — `get`, `update` (in txn, N items)
- `actionsLog`, `notifications` — post-txn
