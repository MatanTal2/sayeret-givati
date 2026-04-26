# db/server/ammunitionInventoryService.ts

**File:** `src/lib/db/server/ammunitionInventoryService.ts`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Server-side CRUD for ammunition holdings. Two collections — one service:

- `ammunitionInventory` — BRUCE + LOOSE_COUNT stock per (template, holder).
  Doc id is deterministic: `${holderType}_${holderId}_${templateId}` so an
  upsert is safe and idempotent.
- `ammunition` — SERIAL items. Doc id is the serial number (צ).

## Permission model (enforced here)

Implemented in `canMutateAmmunitionInventory(ctx)`:

- `ADMIN | SYSTEM_MANAGER | MANAGER` → any holder, any template.
- `ammoNotificationRecipientUserId` (from `systemConfig/main`) → any holder.
- `TEAM_LEADER` → own team + members of own team. Holder team is resolved by
  reading the holder user's `teamId` field.
- `USER` → self only, and only on USER- or BOTH-allocated templates.

For `update / delete`, USER and TEAM_LEADER actors are additionally restricted
to docs they themselves created (`createdBy === actor.uid`); MANAGER+ override
is allowed; the responsible-manager flag is also a manager-equivalent override.

## Exports

| Export | Purpose |
|--------|---------|
| `canMutateAmmunitionInventory(ctx)` | Permission gate — also called inside the service before each write. |
| `validateUpsertStockInput` | Pure validator for the BRUCE/LOOSE_COUNT upsert payload. |
| `validateCreateSerialItemInput` | Pure validator for the SERIAL item create payload. |
| `serverUpsertAmmunitionStock` | Idempotent BRUCE/LOOSE_COUNT write. Stamps `createdBy` on first write only. Rejects SERIAL templates. |
| `serverDeleteAmmunitionStock` | Delete by `inventoryDocId`. Permission re-checked. |
| `serverListAmmunitionStock` | Collection scan. |
| `serverCreateSerialItem` | Create one ammunition item by serial. Rejects non-SERIAL templates and duplicates. |
| `serverUpdateSerialItem` | Update holder / status. Re-checks permission against both old and new holder. |
| `serverDeleteSerialItem` | Delete by serial. Permission re-checked. |
| `serverListSerialItems` | Collection scan. |

## Firebase Operations

- `ammunitionInventory` — `set(merge)`, `delete`, `get`, collection scan.
- `ammunition` — `set`, `update`, `delete`, `get`, collection scan.
- `ammunitionTemplates` — `get` (template lookup before each mutation).
- `systemConfig/main` — `get` (responsible-manager check).
- `users/{uid}` — `get` (TL → holder team-id resolution).

## Notes

- `getResponsibleManagerId` is called per mutation by non-manager actors. The
  read is one small doc; if this becomes a hotspot, cache it in a request-scope
  map.
- The `actor's own writes only` rule for USER/TL relies on `createdBy` being
  set on every doc — first writes always set it; subsequent merges do not.
- Phase 4 will run reports inside a transaction that decrements stock; it will
  reuse `canMutateAmmunitionInventory` as the gate.
