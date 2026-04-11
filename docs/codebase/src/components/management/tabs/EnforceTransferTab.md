# EnforceTransferTab.tsx

**File:** `src/components/management/tabs/EnforceTransferTab.tsx`  
**Lines:** 156  
**Status:** Placeholder (mock data)

## Purpose

Forced equipment transfer form with a pending transfer approval table. Allows admin to override standard transfer flow. Currently uses local state and mock data — no Firestore integration for the enforcement.

## State

| State | Type | Purpose |
|-------|------|---------|
| `selectedEquipment` | `string` | Equipment selector |
| `fromUser` | `string` | Source user |
| `toUser` | `string` | Target user |
| `reason` | `string` | Transfer reason |

## Known Issues

- Transfer enforcement is not implemented — UI only.
- Mock data for pending transfers table.
- Extensive inline Hebrew.
