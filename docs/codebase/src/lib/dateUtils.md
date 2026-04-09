# dateUtils.ts

**File:** `src/lib/dateUtils.ts`  
**Lines:** 43  
**Status:** Active

## Purpose

Hebrew locale date formatting with Israel timezone (`Asia/Jerusalem`).

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `formatReportDate` | `(date: Date) => string` | Full Hebrew date (e.g. "יום שני, 9 באפריל 2026") |
| `formatReportTime` | `(date: Date) => string` | Time in HH:MM format |
| `formatLastUpdated` | `(date: Date) => string` | Date + time combined |
| `formatCacheErrorDate` | `(date: Date) => string` | Short date format for cache error display |
