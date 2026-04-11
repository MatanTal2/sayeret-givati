# actionsLogService.ts

**File:** `src/lib/actionsLogService.ts`  
**Lines:** 287  
**Status:** Active (partially migrated to hybrid architecture)

## Purpose

Global audit logging for all equipment-related actions. **Writes** now delegate to a Server Action (`createActionLogAction`) which uses `firebase-admin` via `src/lib/db/server/actionsLogService.ts`. **Reads** remain on the client SDK for query flexibility.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `createActionLog` | `(data) => Promise<string>` | Creates audit log entry — **delegates to Server Action** |
| `getEquipmentActionLogs` | `(equipmentId, limit?) => Promise<ActionsLog[]>` | Logs for specific equipment (client SDK read) |
| `getActionLogsByType` | `(actionType, limit?) => Promise<ActionsLog[]>` | Logs by action type (client SDK read) |
| `getActionLogsByActor` | `(actorId, limit?) => Promise<ActionsLog[]>` | Logs by actor (client SDK read) |
| `getRecentActionLogs` | `(limit?) => Promise<ActionsLog[]>` | Most recent logs (client SDK read) |
| `getActionLogsByDateRange` | `(start, end, limit?) => Promise<ActionsLog[]>` | Logs within date range (client SDK read) |
| `ActionLogHelpers` | object | Helper methods for creating typed log entries |

## Firebase Operations

| Collection | Operation | SDK | Function |
|------------|-----------|-----|----------|
| `actionsLog` | `add` | **Admin (server)** | `createActionLog()` → Server Action → `serverCreateActionLog()` |
| `actionsLog` | `getDocs`, `query` | Client | All read/query functions |

## Architecture

```
Client calls createActionLog()
  → Server Action: createActionLogAction() [src/app/actions/actionsLog.ts]
    → serverCreateActionLog() [src/lib/db/server/actionsLogService.ts]
      → createDoc() [src/lib/db/core.ts]
        → adminDb.collection().add() [firebase-admin]
```
