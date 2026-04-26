# lib/ammunition/reportsService.ts

**File:** `src/lib/ammunition/reportsService.ts`
**Status:** Active (Phase 4 — Ammunition feature)

## Purpose

Client-side reads for `ammunitionReports`. Filters supported:
date range, team, reporter, template. Always ordered by `usedAt desc`.

## Exports

| Export | Purpose |
|--------|---------|
| `listAmmunitionReports(filter?)` | Run the query against the client SDK. |

Phase 5 (manager dashboard) will reuse this. Phase 8 Firestore rules will
restrict the read to manager+; until then the API is the gate, and the UI
filters by team in the consumer.
