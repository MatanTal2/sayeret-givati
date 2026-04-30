# Ammunition Central Stock — Phase 9

Status: PROPOSED. No code yet. Awaiting user sign-off on this spec.

## Context

Today the ammunition model has only per-holder stock (USER + TEAM). Anyone with `canMutateAmmunitionInventory` can conjure new stock straight onto a holder via `/ammunition` Add. There is no notion of a unit-level pool, so:

- Ammo that exists in the unit warehouse but is not yet handed out has nowhere to live.
- You can't reconcile "how much does the unit own in total" against per-holder bookkeeping.
- The existing `RestockRequestModal` UI has no source to draw against — restocks are an open loop.
- "Add stock" is administratively wrong: it lets users invent ammo. Real assignments come from a central pool.

Phase 9 introduces a **central stock pool**. Admin-managed quantities live in one well-known place; assigning to a USER or TEAM decrements the pool and increments the target holder atomically. SERIAL items live centrally until issued, then flip holder.

## Scope

**In scope:**

- New `UNIT` holder type — single global pool per template.
- `ammunitionInventory` doc per template at `UNIT_main_${templateId}` (BRUCE / BELT / LOOSE_COUNT).
- `ammunition` SERIAL items can be held by `UNIT_main` (status stays `AVAILABLE`).
- Server-side assign txn that moves stock UNIT → USER/TEAM (and returns: USER/TEAM → UNIT).
- Management sub-tab "מלאי מרכזי" — admin-only CRUD on UNIT pool + per-row "הקצה" action.
- Restrict raw "Add" on `/ammunition`: USERs can no longer create stock from nothing; admin-only flow stays for bootstrapping.
- Wire `RestockRequestModal` to draw from UNIT on approval.
- Firestore rules unchanged at the deny level (writes still go through firebase-admin); add UNIT write gate inside `canMutateAmmunitionInventory`.

**Out of scope (deferred):**

- Multiple central depots (`UNIT_main`, `UNIT_company_a`, …). Single `main` for now; the keying leaves room.
- Auto-reconcile / audit comparing per-holder sums against UNIT.
- Approval workflow on assign. Assign is direct.
- TTL cache (still queued separately as task D).

## Data model

### Type changes

`src/types/ammunition.ts`:

```ts
export type HolderType = 'USER' | 'TEAM' | 'UNIT';
```

`AmmunitionStock.holderType` and `AmmunitionItem.currentHolderType` widen accordingly. No new fields — the UNIT holder reuses the same `bruceCount` / `openBruceState` / `quantity` shape.

### Doc id convention

- BRUCE / BELT / LOOSE_COUNT pool: `ammunitionInventory/UNIT_main_${templateId}`.
- SERIAL items in pool: same `ammunition/${serial}` doc as today, with `currentHolderType: 'UNIT'`, `currentHolderId: 'main'`, `status: 'AVAILABLE'`.

`UNIT_main_*` is the only allowed UNIT id in this phase. The `_main` slot reserves the option of multiple depots later without a migration.

### New `actionsLog` action types

- `AMMO_ASSIGNED_FROM_CENTRAL` — UNIT → USER/TEAM.
- `AMMO_RETURNED_TO_CENTRAL` — USER/TEAM → UNIT.

Stored on actionsLog with `templateId`, `qty | serial`, `from`, `to`, `actorId`.

## Permissions

`canMutateAmmunitionInventory` extended:

- UNIT writes: ADMIN / SYS_MANAGER / `ammoNotificationRecipientUserId` only. MANAGER role is **not** allowed to mutate UNIT — too low for warehouse decisions. (Open Q below if you want MANAGER too.)
- Existing per-holder rules unchanged.

`/ammunition` Add modal restriction:

- USER + TEAM_LEADER: cannot pick "מקור: יש לי כבר" path that creates stock from thin air. They can only *receive* via assign-from-central or restock fulfillment.
- ADMIN / SYS_MANAGER: still allowed direct add (back-door for migration, lost paperwork, etc.) but UI nudges toward UNIT-then-assign.

## Assign flow (server transaction)

`serverAssignFromCentral({ actor, templateId, target, payload })`:

- `target = { holderType: 'USER' | 'TEAM', holderId }`.
- `payload`:
  - BRUCE / BELT: `{ bruceCount }` (open-bruce state stays at the source pool).
  - LOOSE_COUNT: `{ quantity }`.
  - SERIAL: `{ serial }`.

Transaction:

1. Read UNIT doc (or SERIAL item).
2. Assert UNIT has enough (`bruceCount >= n` / `quantity >= n` / SERIAL is at UNIT and `AVAILABLE`).
3. Decrement UNIT (or flip SERIAL `currentHolder*` to target).
4. Upsert target stock (create or `bruceCount += n` / `quantity += n`).
5. Write `actionsLog` entry inside txn.

Symmetric `serverReturnToCentral` for the reverse. Notification fan-out happens **post-txn** mirroring the report flow.

## UI

### `/management → ammunition tab → "מלאי מרכזי"` (new sub-tab)

Admin-only. Same expandable-row pattern as the inventory view:

- Row collapsed: template name · qty (`X ברוסים` / `X יח׳` / `X פריטים סריאליים`) · subcategory · security badge.
- Row expanded: tracking-mode details, list of SERIAL items with their צ.
- Kebab actions: "הוסף למלאי" (admin direct add into pool, replaces today's per-holder Add), "הקצה" (open assign modal), "מחק" (only when qty=0).

### Assign modal

- Picks target: USER (typeahead) or TEAM (id + name).
- Per tracking mode: input the `bruceCount` / `quantity` / SERIAL multi-select (all available צ items in pool for that template).
- Validates against pool balance client-side; server re-checks.
- Submit → toast + refresh. Notification deep-link to recipient.

### `/ammunition` restrictions

- "הוסף מלאי" button: hidden for USER / TEAM_LEADER.
- ADMIN sees an info banner pointing to `/management → מלאי מרכזי` for the canonical add flow.

### `RestockRequestModal` wiring

Currently a UI stub on the training page. On approve, server resolves the request quantity → `serverAssignFromCentral` against the requester. Hooks onto the existing approval path.

## Migration

No backfill. Start UNIT empty. Admin populates manually or via CSV (extend the bulk-import to support central stock — listed as a follow-up below).

This means existing per-holder stock is untouched. The unit's stated pool will under-report at first; admin reconciles by entering real warehouse numbers.

## Tests

New: `src/lib/db/server/__tests__/ammunitionAssignService.test.ts`:

- Happy path: UNIT 10 → USER 0; assign 3 → UNIT 7, USER 3, action log written.
- Over-assign rejected: UNIT 2, request 5 → throws, no writes.
- SERIAL flip: item starts at UNIT, assign → currentHolderType becomes USER, status stays AVAILABLE.
- Permission: USER actor → forbidden. TEAM_LEADER → forbidden (admin-only at UNIT).

Extend `ammunitionInventoryService.test.ts` with:

- UNIT permission case in `canMutateAmmunitionInventory` (admin allowed, manager denied, responsible-manager allowed).

Touch `ammunitionInventoryService.ts` only minimally: just permission + the new `'UNIT'` case in the `holderType` switches.

## Firestore rules

`firebase/firestore.rules` — no client-write change (still deny). Server keys on the new `holderType`. Run `firebase deploy --only firestore:rules` is a no-op for this phase.

## Implementation steps

1. Type widening (`HolderType`) + cascading TS errors fixed.
2. `serverAssignFromCentral` + `serverReturnToCentral` + tests.
3. `canMutateAmmunitionInventory` UNIT branch + tests.
4. API route: `POST /api/ammunition-inventory` action `assign_from_central` and `return_to_central`. Or keep a sub-route `/api/ammunition-inventory/assign` for clarity.
5. New management sub-tab `CentralStockSection` + `AssignFromCentralModal`.
6. `/ammunition` Add restrictions + info banner.
7. `RestockRequestModal` wiring on approval.
8. Docs update + actionsLog action types.

Each step is one commit. Estimated 6–8 commits.

## Open questions

1. **MANAGER role**: allow UNIT mutations or admin-only? Spec defaults admin-only. If your manager population owns warehouse, flip it.
2. **Pool entry source**: bulk CSV for UNIT or hand-entry only? Spec says hand-entry first; CSV is a small follow-up if useful.
3. **Open-bruce state at UNIT**: pool tracks only full ברוסים? Or carry one open-bruce state per template? Spec says full only — open-bruce is created on assignment. Simpler.
4. **SERIAL multi-issue**: assign N serials in one click vs one-by-one? Spec says multi-select, single txn.
5. **Notification on assign**: fire to recipient (and TL?) so they see new ammo in their inventory? Spec says yes, recipient + reporter's TL. Mirror of the report flow's recipient list.
6. **Return path**: separate UI button or piggyback on the existing "החזר לאחראי" action? Spec says reuse — return-to-mgr becomes return-to-UNIT semantically.

## Verification

After implementation:

1. Admin populates UNIT pool with one BRUCE template (5 ברוסים) and one SERIAL item.
2. Assigns 2 ברוסים to a TEAM and the SERIAL item to a USER.
3. UNIT shows 3 ברוסים + 0 serials. TEAM shows 2 ברוסים. USER inventory shows the serial.
4. Reporter submits a usage report; UNIT untouched, target's per-holder stock decrements.
5. User returns the serial to mgr; serial flips back to UNIT.
6. Lint + build clean. New tests pass. Pre-existing failures untouched.

## Resume pointer

Branch (target): `feat/ammunition-central-stock` off updated `main` after the current PR `fix/ammo-defects-and-central-stock` merges. Do NOT pile this on top of the open PR.
