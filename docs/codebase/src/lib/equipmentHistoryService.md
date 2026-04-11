# equipmentHistoryService.ts

**File:** `src/lib/equipmentHistoryService.ts`  
**Lines:** 243  
**Status:** Active

## Purpose

Tracking history management for equipment. Creates structured history entries for all equipment lifecycle events (creation, transfers, status/condition/location updates, maintenance). Maintains a 20-record limit per equipment item.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `addTrackingHistoryEntry` | `(equipment, entry) => TrackingHistory[]` | Adds entry with 20-record cap |
| `createEquipmentCreatedEntry` | `(createdBy) => TrackingHistory` | Creation event |
| `createTransferRequestedEntry` | `(from, to, reason) => TrackingHistory` | Transfer request |
| `createTransferApprovedEntry` | `(approvedBy) => TrackingHistory` | Transfer approval |
| `createTransferRejectedEntry` | `(rejectedBy, reason) => TrackingHistory` | Transfer rejection |
| `createStatusUpdateEntry` | `(oldStatus, newStatus, updatedBy) => TrackingHistory` | Status change |
| `createConditionUpdateEntry` | `(oldCond, newCond, updatedBy) => TrackingHistory` | Condition change |
| `createLocationUpdateEntry` | `(oldLoc, newLoc, updatedBy) => TrackingHistory` | Location change |
| `createMaintenanceStartEntry` / `...CompleteEntry` | `(updatedBy) => TrackingHistory` | Maintenance events |
| `getMostRecentHistoryEntry` | `(history) => TrackingHistory \| null` | Latest entry |
| `getHistoryEntriesByAction` | `(history, action) => TrackingHistory[]` | Filter by action type |
| `getHistoryEntriesByDateRange` | `(history, start, end) => TrackingHistory[]` | Filter by date range |

## Notes

- Pure utility functions — operates on equipment objects, not Firestore directly.
- History entries are stored as an array field within the equipment document.
