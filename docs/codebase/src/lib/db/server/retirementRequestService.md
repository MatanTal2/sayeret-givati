# db/server/retirementRequestService.ts

**File:** `src/lib/db/server/retirementRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Admin-SDK writes for `retirementRequests`. Handles approve + reject by the current holder. Creation happens in `serverRetireEquipment` (signer-initiated path).

## Exports

| Export | Purpose |
|--------|---------|
| `serverApproveRetirementRequest` | Transactionally transitions equipment to `RETIRED` and updates request status. Post-txn: action log + notify signer. |
| `serverRejectRetirementRequest` | Transactionally sets request status to `REJECTED`. Post-txn: action log + notify signer. |

## Enforcement

- Approver/rejector UID must match `request.holderUserId` — throws otherwise.
- Request must be in `PENDING` state — throws otherwise.

## Firebase Operations

- `retirementRequests` — `get`, `update` (txn)
- `equipment` — `get`, `update` (txn, approve only — status → RETIRED)
- `actionsLog`, `notifications` — post-txn

## Notes

- Manager-level "oversight" of these requests is read-only in Phase 4; the holder remains the sole approver.
