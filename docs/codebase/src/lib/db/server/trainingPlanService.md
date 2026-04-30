# trainingPlanService (server)

**File:** `src/lib/db/server/trainingPlanService.ts`
**Status:** Active (Phase 1 — Ammunition Training).

Server-side mutations for the `trainingPlans` collection. Reads use the
client SDK (see `src/lib/training/trainingPlansService.ts`).

## Exports

- `validateCreateTrainingPlanInput(input): CreateTrainingPlanInput` —
  validator for the POST body. Asserts required text fields, positive
  headcount, `endAtMs > startAtMs`, and a non-empty `ammoLines[]` whose
  rows each carry `templateId`, `templateName` (denormalized), and
  `qty > 0`.
- `serverCreateTrainingPlan({ actor, plannedByName, payload })` — creates
  a doc with `status='PENDING_APPROVAL'`, then fires a
  `TRAINING_PLAN_SUBMITTED` notification to the ammo-responsible user.
  Enforces TL+ role and (for non-admin/sysmgr) that the plan's `teamId`
  matches the actor's team.
- `serverTransitionTrainingPlan({ actor, actorName, planId, action, reason? })` —
  state machine in a Firestore transaction. `action ∈
  {approve|reject|cancel|complete}`. Permission matrix and lifecycle
  rules are enforced inside the transaction. Post-commit fires
  `TRAINING_PLAN_APPROVED` / `TRAINING_PLAN_REJECTED` notifications.
- `serverCreateRestockRequest({ actor, actorName, planId, templateId, templateName, shortfallQty, note? })` —
  validates inputs, then fires an `AMMO_RESTOCK_REQUEST` notification to
  `systemConfig.ammoNotificationRecipientUserId`. Throws if no
  ammo-responsible user is configured.

## Notes

- `getAmmoResponsibleUserId()` reads `systemConfig/main` once per call.
  Cache if performance becomes a concern.
- `tx.update` requires `FirebaseFirestore.UpdateData<...>` typing — using
  a plain `Record<string, unknown>` is rejected by `tsc`.
- Notifications are best-effort (try/catch) so a notification outage
  does not break the lifecycle write.
