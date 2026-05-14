# db/server/exchangeRequestService.ts

**File:** `src/lib/db/server/exchangeRequestService.ts`
**Status:** Active
**Spec:** `docs/spec/equipment-exchange-and-storage.md`

## Purpose

Admin-SDK writes for the `exchangeRequests` collection plus the related two-doc swap on `equipment`. Models the broken-item swap flow: holder marks item broken → signer approves with a new serial → old doc retired with `successorDocId`, new doc created with `predecessorDocId` pointing back. Signer can also bypass the request step via direct "replace by another."

Mirrors `retirementRequestService.ts` in shape but reverses the roles: holder requests, signer approves.

## Exports

| Export | Permission | Effect |
|--------|------------|--------|
| `serverRequestExchange` | Actor must equal `equipment.currentHolderId` and equipment must be `AVAILABLE`. | Writes new `exchangeRequests/{auto}` with status `PENDING`. Flips equipment status to `EXCHANGE_REQUESTED`. Notifies signer. |
| `serverApproveExchangeRequest` | Actor must equal `exchangeRequest.signerUserId`; request must be `PENDING`. | Atomic transaction: retires old doc (`status=RETIRED` + `successorDocId`), creates new doc at `equipment/{newSerialNumber}` (`predecessorDocId` points back, `condition=GOOD`, inherits template/holder/signer/team fields), updates request to `APPROVED` with `newEquipmentDocId`. Notifies holder. |
| `serverRejectExchangeRequest` | Actor must equal `exchangeRequest.signerUserId`; request must be `PENDING`. | Sets request to `REJECTED`. Reverts equipment back to `AVAILABLE` (only if still `EXCHANGE_REQUESTED`). Notifies holder. |
| `serverReplaceByAnother` | Actor must equal `equipment.signedById` and equipment must be `AVAILABLE`. | Signer-direct path: same atomic retire-and-create batch as approve, plus writes an `exchangeRequests/{auto}` with `initiatedBySigner=true`, `status=APPROVED` for audit. Notifies holder. |

## Enforcement

- **Request:** holder + AVAILABLE only. Empty reason rejected.
- **Approve / Reject:** signer + PENDING request only.
- **Replace-by-another:** signer + AVAILABLE only.
- **Duplicate serial:** approve and replace-by-another both check `equipment/{newSerialNumber}` does not already exist before creating.

All four functions read state inside `runTransaction` so the AVAILABLE/EXCHANGE_REQUESTED status check and the equipment write happen atomically.

## Firebase Operations

- `exchangeRequests` — `set` (auto-id), `update` (txn)
- `equipment` — `get`, `set` (new doc), `update` (txn, old doc + status flip)
- `actionsLog` — post-txn writes for `EXCHANGE_REQUESTED`, `EXCHANGE_APPROVED`, `EXCHANGE_REJECTED`, `EXCHANGE_COMPLETED`
- `notifications` — post-txn writes targeting holder or signer depending on path

## New-doc field inheritance

When the new doc is created (approve or replace-by-another), these fields are copied from the old doc: `equipmentType`, `productName`, `category`, optional `subcategory`/`model`/`manufacturer`, `currentHolder`/`currentHolderId`, `signedBy`/`signedById`, `location`, optional `holderTeamId`/`signerTeamId`/`catalogNumber`/`requiresDailyStatusCheck`/`hasSerialNumber`. The new doc resets `condition` to `GOOD`, `status` to `AVAILABLE`, and stamps `acquisitionDate`/`dateSigned`/`lastSeen`/`lastReportUpdate` to the transaction timestamp.

## Predecessor chain

The `predecessorDocId` link is the contract `ActionHistoryPanel` walks to render a single timeline across the swap chain (up to 10 levels deep, cycle-guarded). Retired docs keep their full `trackingHistory` and `actionsLog`, so nothing is lost when the new doc is created.

## Tests

`src/lib/db/server/__tests__/exchangeRequestService.test.ts` — 14 tests covering all four flows, permission gates, status preconditions, and duplicate-serial detection.
