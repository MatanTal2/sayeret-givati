# actionsLogService.ts

**File:** `src/lib/actionsLogService.ts`  
**Lines:** 287  
**Status:** Active

## Purpose

Global audit logging for all equipment-related actions. Creates log entries in the `actionsLog` collection and provides query functions for retrieving logs by equipment, type, actor, date range, or recency.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createActionLog` | `(logData) => Promise<string>` | Creates a new audit log entry |
| `getEquipmentActionLogs` | `(equipmentId, limit?) => Promise<ActionLog[]>` | Logs for specific equipment |
| `getActionLogsByType` | `(actionType, limit?) => Promise<ActionLog[]>` | Logs by action type |
| `getActionLogsByActor` | `(actorId, limit?) => Promise<ActionLog[]>` | Logs by actor |
| `getRecentActionLogs` | `(limit?) => Promise<ActionLog[]>` | Most recent logs |
| `getActionLogsByDateRange` | `(start, end, limit?) => Promise<ActionLog[]>` | Logs within date range |
| `ActionLogHelpers` | object | Helper methods for creating typed log entries (transfer, status change, creation, etc.) |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `actionsLog` | `addDoc` | `createActionLog()` |
| `actionsLog` | `getDocs`, `query(where, orderBy, limit)` | All query functions |
