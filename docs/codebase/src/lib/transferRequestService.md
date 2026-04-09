# transferRequestService.ts

**File:** `src/lib/transferRequestService.ts`  
**Lines:** 438 ⚠️ LONG  
**Status:** Active

## Purpose

Transfer request workflow: create, approve, and reject equipment transfer requests. Approval uses Firestore transactions to atomically update both the transfer request and the equipment document. Creates audit log entries for all operations.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createTransferRequest` | `(equipmentId, toUserId, toUserName, reason, fromUserId, fromUserName, note?) => Promise<string>` | Creates pending transfer request |
| `approveTransferRequest` | `(requestId, approvedBy, approverName) => Promise<void>` | Approves and executes transfer (transaction) |
| `rejectTransferRequest` | `(requestId, rejectedBy, rejectorName, reason?) => Promise<void>` | Rejects transfer request |
| `getEquipmentTransferRequests` | `(equipmentId) => Promise<TransferRequest[]>` | All requests for equipment |
| `getPendingTransferRequestsForUser` | `(userId) => Promise<TransferRequest[]>` | Pending requests targeting user |
| `getAllPendingTransferRequests` | `() => Promise<TransferRequest[]>` | All pending requests (admin) |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `transferRequests` | `addDoc` | `createTransferRequest()` |
| `transferRequests` | `getDoc` | `approveTransferRequest()`, `rejectTransferRequest()` |
| `transferRequests` | `getDocs`, `query(where, orderBy)` | Query functions |
| `transferRequests` | `transaction.update` | `approveTransferRequest()` |
| `equipment` | `transaction.get`, `transaction.update` | `approveTransferRequest()` |
| `actionsLog` | `addDoc` | Via `createActionLog()` (indirect) |

## Notes

- 438 lines — could split query functions from mutation functions.
- `approveTransferRequest()` uses `runTransaction()` for atomic equipment ownership change.
