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
| `serverReportEquipment` | Appends history entry, updates `lastReportUpdate` + `lastReportPhotoUrl` + `currentCondition`, writes `REPORT_SUBMITTED` action log with `details.condition`. The tracking entry carries `actor` + `condition` + optional `photoUrl`. Photo may be null only when actor has `canReportWithoutPhoto`. `condition` is required (validated upstream in the API route). |
| `serverRetireEquipment` | Signer-initiated. Returns `{ kind: 'retired' }` when signer==holder (immediate RETIRED status), else `{ kind: 'request_created', requestId }` and creates a `retirementRequests` doc routed to the holder. |
| `serverSendToStorage` | Holder-initiated. Flips `AVAILABLE → STORED`, logs `STORED` action. |
| `serverPullFromStorage` | Holder-initiated. Pre-checks `SystemConfig.roundOpen === true`; flips `STORED → AVAILABLE`, logs `REISSUED` action. |

## Firebase Operations

- `equipment` — `set`, `update` (all via transaction)
- `actionsLog` — `set` (post-transaction)
- `retirementRequests` — `set` (inside retire transaction when request is created)
- `users` — `get` (to denormalize target profile team/unit)
- `notifications` — indirect via `serverCreateNotification`

## Notes

- Any change to `currentHolderId` or `signedById` MUST also update the matching `holderTeamId/UnitId` or `signerTeamId/UnitId` in the same transaction.
- Storage transitions are holder-only: `serverSendToStorage` and `serverPullFromStorage` both require `actor.uid === equipment.currentHolderId`. `transferRequestService` rejects creation against items in `STORED` or `EXCHANGE_REQUESTED` status.
- `serverSendToStorage` and `serverPullFromStorage` denormalize the actor display name into the tracking history entry (`actor: input.actorName`) so the history panel can surface it without a separate user-lookup. Same field is populated on `equipment_created` entries by `createEquipmentCreatedEntry` in `equipmentHistoryService`.
- Exchange-flow (broken-item swap that creates a new doc with a new serial) lives in `exchangeRequestService.ts`, not here. See `docs/spec/equipment-exchange-and-storage.md`.
