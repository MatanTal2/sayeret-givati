# /ammunition/training

**File:** `src/app/ammunition/training/page.tsx`
**Status:** Active.

## Composition

```
AmmunitionTrainingPage
  AuthGuard
    AppShell
      Suspense (boundary for useSearchParams)
        AmmunitionTrainingPageContent
          AmmunitionBellyView   (current on-hand inventory by template)
          PlannedTrainingsTable (active + archived sections)
          PlanTrainingModal     (opened by "+ הוסף אימון" — TL+ only)
```

## Deep link — `?planId=`

The page reads `planId` from `useSearchParams` and forwards it to `PlannedTrainingsTable` as `highlightPlanId`. The matching row gets a `bg-warning-50 ring-2 ring-warning-400` highlight and scrolls into view on mount via a ref + `scrollIntoView({ behavior: 'smooth', block: 'center' })`. If the plan is in the archived bucket, the archive `Disclosure` is `defaultOpen` so the row is reachable.

This deep link is the target route for training-plan notifications (`TRAINING_PLAN_SUBMITTED`, `TRAINING_PLAN_APPROVED`, `TRAINING_PLAN_REJECTED`, `AMMO_RESTOCK_REQUEST`) — see `resolveNotificationTarget` in `src/components/notifications/NotificationItem.tsx`.

`useSearchParams` requires a Suspense boundary in App Router client pages or the page fails to prerender — that's why the body is split into `AmmunitionTrainingPageContent` under `<Suspense>`.

## Hook

`useTrainingPlans()` owns plan state + actions (`create`, `approve`, `reject`, `cancel`, `complete`, `requestRestock`).

## Authorization

TL+ sees the "+ הוסף אימון" button. Approve/reject is gated inside `PlannedTrainingsTable` to admin / system manager / ammo-responsible user (from `systemConfig.ammoNotificationRecipientUserIds`).
