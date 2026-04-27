# useEquipment.ts

**File:** `src/hooks/useEquipment.ts`

Equipment hook owning items + types state and the Phase 6 lifecycle methods.

## Scope (Phase 6)

```ts
useEquipment({ scope: 'self' })
```

The hook keeps a raw list (`getEquipmentList()`) and derives `equipment` per scope:

- `self` — items where the user is signer or holder.
- `team` — items the user is in via `holder*TeamId/UnitId` or `signer*TeamId/UnitId`, **plus** their own.
- `all` — every item the user can see (`canView` from `equipmentPolicy`).

`canView` runs first regardless of scope, so the scope filter never accidentally widens visibility past what the policy allows.

`scope` and `setScope` are returned so the page can flip via `EquipmentTabs`.

## Phase-6 mutation methods

- `reportEquipment(id, photoUrl|null, note?)` → `EquipmentService.Items.reportEquipment` with the actor.
- `retireEquipment(id, reason)` → returns `{ success, kind?: 'immediate' | 'request', error? }` so the caller (ReturnModal) can show "retired" vs "request sent" copy without inferring it.
- `createEquipmentBatch(items, notes?)` → wraps `EquipmentService.Items.createEquipmentBatch`. Used by `AddEquipmentWizard` for both single and bulk submits (single mode is a 1-element batch).

## Legacy methods kept

`addEquipment`, `transferEquipment`, `updateEquipmentStatus`, `updateEquipmentCondition`, `performDailyCheck`, plus the `getEquipmentBy*` selectors.

## Auth wiring

`onAuthStateChanged` triggers a refresh; sign-out clears state. The hook does not subscribe to Firestore live updates — refresh-on-mutation is the consistency model.
