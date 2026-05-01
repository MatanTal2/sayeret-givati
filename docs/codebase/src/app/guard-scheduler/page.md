# page.tsx (Guard Scheduler)

**File:** `src/app/guard-scheduler/page.tsx`
**Status:** ✅ Live

## Purpose

`/guard-scheduler` — wizard entry point for the Guard Schedule Generator (מחולל שמירות).

Wraps `AuthGuard` + `AppShell` and renders `GuardSchedulerWizard`. Auto-loads a localStorage draft if present.

For deep links to a saved schedule, see `src/app/guard-scheduler/[id]/page.tsx`, which loads via `getGuardSchedule(id)` and seeds the wizard with the persisted state.

Spec: `docs/spec/guard-scheduler.md`.
