# equipmentUtils.ts

**File:** `src/lib/equipmentUtils.ts`  
**Lines:** 615 ⚠️ LONG  
**Status:** Active

## Purpose

Generic utility functions for equipment management: creating equipment objects, transfers, status/condition updates, permissions, filtering, sorting, and display formatting. Pure functions — no direct Firestore access.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createHistoryEntry` | `(action, details, updatedBy) => TrackingHistory` | Creates a history entry object |
| `createNewEquipment` | `(data) => Equipment` | Creates a new equipment object with defaults |
| `transferEquipment` | `(equipment, toHolder) => Equipment` | Returns updated equipment with new holder |
| `updateEquipmentStatus` | `(equipment, status) => Equipment` | Returns equipment with new status |
| `updateEquipmentCondition` | `(equipment, condition) => Equipment` | Returns equipment with new condition |
| `performDailyCheckIn` | `(equipment) => Equipment` | Returns equipment with check-in recorded |
| `validateEquipmentId` | `(id) => boolean` | Validates equipment serial number format |
| `getUserPermissions` | `(userType) => Permission[]` | Maps user type to permissions |
| `hasPermission` | `(userType, permission) => boolean` | Checks if user type has specific permission |
| `canUpdateEquipment` | `(userType, equipment, userId) => boolean` | Combined ownership + permission check |
| `filterEquipmentList` | `(equipment, filters) => Equipment[]` | Multi-field filtering |
| `sortEquipmentList` | `(equipment, sortField, order) => Equipment[]` | Column sorting |
| `formatEquipmentDate` | `(timestamp) => string` | Date display formatting |
| `getStatusDisplayText` | `(status) => string` | Status enum to Hebrew text |
| `getConditionDisplayText` | `(condition) => string` | Condition enum to Hebrew text |
| `needsAttention` | `(equipment) => boolean` | Checks if equipment needs attention |

## Notes

- 615 lines — candidate for split by concern (object creation, permissions, filtering/sorting, display).
- Pure functions with no side effects.
