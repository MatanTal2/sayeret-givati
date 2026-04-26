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

- Phase 5 dashboard will pass a richer filter to `refresh`.
- The `/ammunition` page also reuses `submit` to submit reports inline; on
  success, it calls `refresh` on `useAmmunitionInventory` so the BRUCE / LOOSE
  count UI re-renders without a page reload.
