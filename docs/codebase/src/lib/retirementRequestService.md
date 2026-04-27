# retirementRequestService.ts

**File:** `src/lib/retirementRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Client facade for the retirement-request workflow. Creation is triggered indirectly — `EquipmentService.Items.retireEquipment` detects signer≠holder and opens a request through `/api/equipment/retire`. This module exposes approve/reject by the current holder + query helpers.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `approveRetirementRequest` | `(requestId, approverUserId, approverUserName, note?) => Promise<void>` | Holder approves → equipment status → RETIRED |
| `rejectRetirementRequest` | `(requestId, rejectorUserId, rejectorUserName, reason?) => Promise<void>` | Holder rejects |
| `getPendingRetirementRequestsForHolder` | `(holderUserId) => Promise<RetirementRequestDoc[]>` | Holder's inbox |
| `getRetirementRequestsBySigner` | `(signerUserId) => Promise<RetirementRequestDoc[]>` | Signer's outbox |
| `getAllPendingRetirementRequests` | `() => Promise<RetirementRequestDoc[]>` | Manager oversight |

## Firebase Operations

Writes via `/api/retirement-requests/{approve,reject}`. Reads via client SDK on `retirementRequests` collection.

## Notes

- Only the signer initiates retirement; only the current holder approves/rejects. Both enforced server-side.
