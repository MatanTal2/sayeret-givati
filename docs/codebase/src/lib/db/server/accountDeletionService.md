# accountDeletionService.ts

**File:** `src/lib/db/server/accountDeletionService.ts`
**Status:** Active (Settings PR-G)

## Purpose

Server-side service for self-serve account deletion. Exposes three operations:

- `countOutstandingAssetsForUser(uid)` — pre-flight count of equipment / ammo / pending transfers a uid is still holding.
- `serverRequestAccountDeletion({ uid, reason? })` — runs pre-flight, stamps `deletionRequestedAt` on the user doc.
- `serverCancelAccountDeletion(uid)` — clears `deletionRequestedAt` / `deletionReason` if a request is pending.

Hard-delete (Auth user removal + `displayName` rewrite + tombstone) is deliberately NOT here — it lives in a future operator script that runs at `deletionRequestedAt + 30d`.

## Custom errors

| Class | Fires when | Route maps to |
|-------|-----------|--------------|
| `AccountDeletionHasAssetsError` | Pre-flight found at least one outstanding asset. Carries `outstanding` payload | `400 has_outstanding_assets` |
| `AccountDeletionAlreadyRequestedError` | `users.deletionRequestedAt` already set | `400 already_requested` |
| `AccountDeletionNoPendingError` | Cancel called with no pending request | `400 no_pending_request` |

## Pre-flight query shape

Five parallel reads, all server-side (`firebase-admin`):

| Collection | Filter | Counts toward |
|-----------|--------|---------------|
| `equipment` | `currentHolderId == uid` AND `status != EquipmentStatus.RETIRED` | `equipmentCount` |
| `ammunition` | `currentHolderType == 'USER'` AND `currentHolderId == uid` | `ammunitionUserHoldings` |
| `ammunitionInventory` | `holderType == 'USER'` AND `holderId == uid` | `ammunitionUserHoldings` |
| `transferRequests` | `fromUserId == uid` AND `status == TransferStatus.PENDING` | `pendingTransferRequests` |
| `transferRequests` | `toUserId == uid` AND `status == TransferStatus.PENDING` | `pendingTransferRequests` |

`!=` on a Firestore field requires an index in some configurations. If you hit a missing-index error on `equipment.status`, deploy the composite index (Firestore Console will print the URL). The composite isn't in `firestore.indexes.json` today — add when the first query lands in production.

## Soft-delete semantics

`serverRequestAccountDeletion` writes ONLY:

```ts
{ deletionRequestedAt: FieldValue.serverTimestamp(), deletionReason?: string, updatedAt: FieldValue.serverTimestamp() }
```

The user doc's `displayName`, `userType`, role grants, equipment FK fields are all UNTOUCHED so a cancel mid-window restores the user to working order with zero migration. The `displayName → "Deleted User"` rewrite belongs in the hard-delete pass.

## Why no admin override in PR-G

Q4=a — self-serve only. There is no `actorUid !== uid` path here. If a future admin force-delete endpoint lands, it should call a separate `serverForceAccountDeletion(uid, actorUid)` helper that wraps the same pre-flight + extends the audit metadata with `forced_by: actorUid`.
