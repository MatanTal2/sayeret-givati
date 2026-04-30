# Ammunition Training Module — Phase 1

Live spec for the `/ammunition/training` feature. Phase 1 ships:
plan-training form, planned-training list with approval workflow, בטן view,
and in-app restock requests. Email/SMS dispatch and auto `COMPLETED`
transitions are deferred to Phase 2.

## Domain model

Firestore collection: `trainingPlans`. Document shape — see
`src/types/training.ts`.

```ts
type TrainingPlanStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'COMPLETED';
```

Lifecycle:

```
PENDING_APPROVAL ──approve──▶ APPROVED ──complete──▶ COMPLETED
        │                       │
        │                       └────cancel────▶ CANCELED
        ├──────reject──▶ REJECTED
        └──────cancel──▶ CANCELED
```

Each plan stores a denormalized `templateName` per `ammoLines[]` row so the
list view doesn't need a join.

## Permissions

| Action          | Who                                                         |
|-----------------|-------------------------------------------------------------|
| Create plan     | Team leader and above (`UserType.TEAM_LEADER` or higher)    |
| Approve / reject| Ammo-responsible (`systemConfig.ammoNotificationRecipientUserId`) **or** admin / system_manager |
| Cancel          | Plan creator **or** anyone who can approve                  |
| Complete        | Plan creator **or** anyone who can approve                  |
| Request restock | Anyone who can read the plan                                |

Non-(admin / system_manager) cannot plan trainings for a different team
than `enhancedUser.teamId`.

## Data flow

Hybrid pattern (writes via firebase-admin, reads via client SDK):

- Writes: `POST /api/training-plans`, `PATCH /api/training-plans/[id]`,
  `POST /api/training-plans/[id]/restock-request`. Server service:
  `src/lib/db/server/trainingPlanService.ts`.
- Reads: `src/lib/training/trainingPlansService.ts` →
  `src/hooks/useTrainingPlans.ts`. Hook returns
  `{ plans, isLoading, error, refresh, create, approve, reject, cancel, complete, requestRestock }`.

## בטן view

`src/components/ammunition/AmmunitionBellyView.tsx`. For each ammunition
template that has stock or is referenced by an active plan, show:

| Column     | Source |
|------------|--------|
| Total      | Aggregated from `useAmmunitionInventory` — BRUCE: `Σ bruceCount × cardboardsPerBruce × bulletsPerCardboard`; LOOSE_COUNT: `Σ quantity`; SERIAL: count of items with `status='AVAILABLE'`. |
| Allocated  | `Σ qty` over `ammoLines` of plans with status ∈ `{PENDING_APPROVAL, APPROVED}` |
| Available  | `total − allocated` |

When `available < 0` the row gets a danger highlight and a "בקש תוספת"
button → opens `RestockRequestModal` pre-filled with the shortfall qty.
The modal lets the user choose which active plan the restock is tied to.
Submit → POST to `/api/training-plans/[id]/restock-request` → server
creates an `AMMO_RESTOCK_REQUEST` notification for the ammo-responsible
user.

## Notifications

All in-app — no external email/SMS in Phase 1. Type values added to
`src/types/notifications.ts` (`NotificationType` enum):

| Trigger                    | Recipient                                       | Type                       |
|----------------------------|-------------------------------------------------|----------------------------|
| Plan submitted             | `ammoNotificationRecipientUserId`               | `TRAINING_PLAN_SUBMITTED`  |
| Plan approved              | `plan.plannedBy`                                | `TRAINING_PLAN_APPROVED`   |
| Plan rejected              | `plan.plannedBy` (with `rejectionReason`)       | `TRAINING_PLAN_REJECTED`   |
| Restock requested          | `ammoNotificationRecipientUserId`               | `AMMO_RESTOCK_REQUEST`     |

`relatedEquipmentDocId` carries the `trainingPlanId` for cross-link.

## Critical files

- `src/types/training.ts`
- `src/lib/db/server/trainingPlanService.ts`
- `src/lib/training/trainingPlansService.ts`
- `src/hooks/useTrainingPlans.ts`
- `src/app/api/training-plans/route.ts`
- `src/app/api/training-plans/[id]/route.ts`
- `src/app/api/training-plans/[id]/restock-request/route.ts`
- `src/components/ammunition/PlanTrainingModal.tsx`
- `src/components/ammunition/PlannedTrainingsTable.tsx`
- `src/components/ammunition/AmmunitionBellyView.tsx`
- `src/components/ammunition/RestockRequestModal.tsx`
- `src/app/ammunition/training/page.tsx`
- `src/constants/text.ts` (FEATURES.AMMUNITION.TRAINING block)
- `src/types/notifications.ts` (4 new `NotificationType` values)
- `src/lib/db/collections.ts` (`TRAINING_PLANS`)
- `firebase/firestore.rules` (read rule for `trainingPlans`)

## Phase 2 follow-ups

- Email + SMS dispatch (Resend + Twilio).
- Auto-`COMPLETED` after `endAt` passes.
- Recurring/templated trainings.
- Per-plan attendance roster + headcount validation.
- Range location dropdown from a managed list.
- IN_PROGRESS state.
