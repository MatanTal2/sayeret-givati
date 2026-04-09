# types/equipment.ts

**File:** `src/types/equipment.ts`  
**Lines:** 415 ⚠️ LONG  
**Status:** Active

## Purpose

Equipment tracking and management types. Contains 9+ enums and interfaces covering the full equipment lifecycle: items, types/templates, status, condition, transfers, notifications, tracking history, daily checks, and retirement.

## Key Exports

- `Equipment` — core equipment item interface (serial number, holder, status, condition, location, history, etc.)
- `EquipmentType` — template/type definition
- `EquipmentStatus` — enum: `AVAILABLE`, `SECURITY`, `REPAIR`, `LOST`, `PENDING_TRANSFER`
- `EquipmentCondition` — enum: `GOOD`, `NEEDS_REPAIR`, `WORN`
- `TransferRequest` — transfer request with approval workflow
- `TrackingHistory` — history entry for audit trail
- `Notification` — equipment notification
- `ActionType`, `ApprovalType`, `RetirementType` — supporting enums

## Known Issues

- 415 lines — largest type file. Could split into `equipment-core.ts`, `equipment-transfers.ts`, `equipment-enums.ts`.
