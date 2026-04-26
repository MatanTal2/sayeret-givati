# db/server/equipmentService.ts

**File:** `src/lib/db/server/equipmentService.ts`
**Status:** Active

## Purpose

Admin-SDK writes for `equipment`. All multi-doc writes run in a single Firestore transaction; non-critical side effects (action log, notification) run after the transaction.

## Exports

| Export | Purpose |
|--------|---------|
| `serverCreateEquipment` | Single-item create + action log (txn). |
| `serverUpdateEquipment` | Field update + history entry. |
| `serverTransferEquipment` | Change holder; syncs `holderTeamId/UnitId` from target user profile. |
| `serverCreateEquipmentBatch` | N-item atomic create with shared `batchId`; holder/signer team+unit denormalized from holder profile. |
| `serverReportEquipment` | Appends history entry, updates `lastReportUpdate` + `lastReportPhotoUrl`, writes `REPORT_SUBMITTED` action log. Photo may be null only when actor has `canReportWithoutPhoto`. |
| `serverRetireEquipment` | Signer-initiated. Returns `{ kind: 'retired' }` when signer==holder (immediate RETIRED status), else `{ kind: 'request_created', requestId }` and creates a `retirementRequests` doc routed to the holder. |

## Firebase Operations

- `equipment` — `set`, `update` (all via transaction)
- `actionsLog` — `set` (post-transaction)
- `retirementRequests` — `set` (inside retire transaction when request is created)
- `users` — `get` (to denormalize target profile team/unit)
- `notifications` — indirect via `serverCreateNotification`

## Notes

- Any change to `currentHolderId` or `signedById` MUST also update the matching `holderTeamId/UnitId` or `signerTeamId/UnitId` in the same transaction.
