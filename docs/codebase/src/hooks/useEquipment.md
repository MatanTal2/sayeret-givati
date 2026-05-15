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

## Active / archived partition (bug #25)

The scoped list is split into two buckets:

- `equipment` — everything **except** RETIRED.
- `archivedEquipment` — RETIRED only.

The equipment page (`src/app/equipment/page.tsx`) renders one or the other based on a `view: 'active' | 'archive'` toggle so RETIRED rows don't leak into a holder's working list. RETIRED items still satisfy `canView` (history matters), they just live on a separate surface.

STORED items intentionally stay in the active list — the holder retains logical ownership and needs to see their stored items so they can call `pull-from-storage` when the round opens. Action gating in `equipmentPolicy.ts` ensures the menu collapses to `history` + `pull-from-storage` while STORED, and to `history` only while RETIRED.

## Phase-6 mutation methods

- `reportEquipment(id, photoUrl|null, note?)` → `EquipmentService.Items.reportEquipment` with the actor.
- `retireEquipment(id, reason)` → returns `{ success, kind?: 'immediate' | 'request', error? }` so the caller (ReturnModal) can show "retired" vs "request sent" copy without inferring it.
- `createEquipmentBatch(items, notes?)` → wraps `EquipmentService.Items.createEquipmentBatch`. Used by `AddEquipmentWizard` for both single and bulk submits (single mode is a 1-element batch).

## Legacy methods kept

`addEquipment`, `transferEquipment`, `updateEquipmentStatus`, `updateEquipmentCondition`, `performDailyCheck`, plus the `getEquipmentBy*` selectors.

## Auth wiring

`onAuthStateChanged` triggers a `subscribeEquipmentList` / `subscribeEquipmentTypes` listener pair while authenticated; sign-out unsubscribes and clears state. Listeners replaced the previous refresh-on-mutation model in PR #134 — see `docs/spec/offline-first.md` for the persistent-cache layer that paints listener data synchronously on cold mount.
