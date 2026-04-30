# useAmmunitionReports

**File:** `src/hooks/useAmmunitionReports.ts`
**Status:** Active (Phase 4 — Ammunition feature)

## Purpose

Wraps `/api/ammunition-reports`. Returns a list and a `submit` mutator that
runs the entire report transaction server-side.

## Return shape

```ts
{
  reports: AmmunitionReport[];
  isLoading: boolean;
  error: string | null;
  refresh: (filter?) => Promise<void>;
  submit: (payload) => Promise<{ ok: boolean; reportId?: string }>;
}
```

## Notes

- The hook takes no parameters. Server-side filtering is opt-in per call via
  `refresh(filter)`, where `filter: ListReportsFilter` is forwarded to
  `listAmmunitionReports`. The initial mount calls `refresh()` with the
  default empty filter.
- Earlier the hook accepted an `initialFilter` parameter that defaulted to
  `{}`. Because the default literal produced a fresh object reference on
  every render, the `useCallback` for `refresh` and the `useEffect` that
  invokes it re-fired on every render, causing
  "Maximum update depth exceeded". The parameter was removed; ad-hoc
  filtering is still possible via `refresh(filter)`.
- Phase 5 dashboard will pass a richer filter to `refresh` on demand.
- The `/ammunition` page also reuses `submit` to submit reports inline; on
  success, it calls `refresh` on `useAmmunitionInventory` so the BRUCE / LOOSE
  count UI re-renders without a page reload.
