# useTrainingPlans

**File:** `src/hooks/useTrainingPlans.ts`
**Status:** Active (Phase 1 — Ammunition Training).

## Purpose

Single client-side façade for `trainingPlans`. Pulls a list via
`listTrainingPlans` (client SDK) and exposes mutators that POST/PATCH the
server routes under `/api/training-plans`.

## Return shape

```ts
{
  plans: TrainingPlan[];
  isLoading: boolean;
  error: string | null;
  refresh: (filter?: ListTrainingPlansFilter) => Promise<void>;
  create: (payload: CreateTrainingPlanInput) => Promise<{ ok: boolean; id?: string }>;
  approve: (planId: string) => Promise<boolean>;
  reject:  (planId: string, reason: string) => Promise<boolean>;
  cancel:  (planId: string) => Promise<boolean>;
  complete:(planId: string) => Promise<boolean>;
  requestRestock: (planId: string, payload: RequestRestockPayload) => Promise<boolean>;
}
```

## Notes

- `useEffect` calls `refresh()` once on mount; `useCallback` deps for
  `refresh` are `[]` so the identity is stable (do not regress this — it
  caused the recent infinite-loop bug in `useAmmunitionReports`).
- Display name for actor / planner is computed client-side in
  `actorDisplayName(enhancedUser)`; the server overwrites it with the
  authenticated `displayName` if the body field is missing.
- `transition` is the internal helper that PATCHes the
  `/api/training-plans/[id]` endpoint. The four lifecycle mutators
  (`approve` / `reject` / `cancel` / `complete`) are thin wrappers.
- All mutators trigger a `refresh()` on success so the hook stays in sync.
