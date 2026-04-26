# ForceOperationsTab

**File:** `src/components/management/tabs/ForceOperationsTab.tsx`

Privileged bulk reassignment of holder / signer / both for one or more equipment items.

## Flow

1. **Pick items** — list filtered to items where `canForceTransfer({ user, equipment })` is true. TL+ within team, manager+ everywhere.
2. **Pick kind** — `holder` | `signer` | `both`.
3. **Pick target user** — debounced `UserSearchInput`. Excludes the actor.
4. **Reason** — required free text; written to every action log row produced by the operation.
5. **Execute** — `POST /api/force-ops` with `{ actor, actorUserName, equipmentDocIds, kind, targetUserId, reason }`. Server runs one transaction: updates `currentHolderId` / `signedById` plus the denormalized `holderTeamId/UnitId` / `signerTeamId/UnitId` from the target's user profile, writes N action logs, fires `FORCE_TRANSFER_EXECUTED` / `FORCE_SIGNER_CHANGED` notifications to displaced parties.

## Recent ops panel

Reads `actionsLog` filtered to `FORCE_TRANSFER_HOLDER` + `FORCE_TRANSFER_SIGNER` (twin queries, merged client-side, 20 most recent). Refreshes after every successful execute via the `feedback` effect dep.

## Why no client facade

There is no `forceOpsService.ts` client wrapper — the tab posts directly to `/api/force-ops`. Adding a facade is fine but not necessary; the surface is one route + one body.

## Permission model

The tab itself is gated through `useManagementTabs` (TL+ via `isTeamLeaderOrAbove`); the **per-item** check repeats inside the tab via `canForceTransfer`, so a TL listing the picker only sees items in their team — never "all". The server runs the same gate independently.
