# AuditLogsTab.tsx

**File:** `src/components/management/tabs/AuditLogsTab.tsx`  
**Lines:** 183  
**Status:** Placeholder (mock data)

## Purpose

Audit log viewer with date range, action type, and user filtering. Shows a table of audit entries and summary statistics. Currently uses mock data — does not read from the `actionsLog` Firestore collection.

## State

| State | Type | Purpose |
|-------|------|---------|
| `dateFrom` | `string` | Date range start |
| `dateTo` | `string` | Date range end |
| `actionFilter` | `string` | Action type filter |
| `userFilter` | `string` | User filter |

## Known Issues

- All data is mock/hardcoded. The `actionsLog` collection exists and is written to by other services, but this tab does not read from it.
- Statistics are mock values.
- Extensive inline Hebrew.
