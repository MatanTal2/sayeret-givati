# page.tsx (Equipment)

**File:** `src/app/equipment/page.tsx`
**Lines:** 294
**Status:** Active

## Purpose

Equipment management page (`/equipment` — צלם). Thin orchestration layer that wires `useEquipment` hook state to the equipment component tree. Manages modal visibility (add, update, transfer) and permission checks. Protected by `AuthGuard`.

## Exports / Public API

- `default EquipmentPage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `isRefreshing` | `boolean` | Loading indicator for manual refresh |
| `showAddModal` | `boolean` | Toggle add equipment modal |
| `showUpdateModal` | `boolean` | Toggle update equipment modal |
| `showTransferModal` | `boolean` | Toggle transfer modal |
| `selectedEquipment` | `Equipment \| null` | Equipment item being edited/transferred |

## Firebase Operations

Indirect — all Firebase calls go through `useEquipment` hook → `equipmentService.ts`.

## Notes

- Permission check `hasEquipmentManagementAccess(enhancedUser)` gates add/edit/transfer actions.
- `getUserPermissionLevel(enhancedUser)` result is derived but only partially used in this file.
- The daily status reporting button visible in the UI calls `EquipmentService.updateDailyReport` directly from the page, bypassing the hook layer — minor inconsistency.
