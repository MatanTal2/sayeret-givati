# useAmmunitionReportRequests

**File:** `src/hooks/useAmmunitionReportRequests.ts`
**Status:** Active (Phase 6 — Ammunition feature)

## Purpose

Wraps `/api/ammunition-report-requests`. Used by the management
`AmmunitionRequestsSection` plus the user `/ammunition` page (to read the
linked request when a notification deep link is followed).

## Return shape

```ts
{
  requests: AmmunitionReportRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create(payload): Promise<{ ok: boolean; id?: string }>;
  cancel(requestId): Promise<boolean>;
}
```
