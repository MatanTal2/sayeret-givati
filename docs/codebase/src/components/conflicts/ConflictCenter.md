# ConflictCenter.tsx

**File:** `src/components/conflicts/ConflictCenter.tsx`
**Status:** Active (Phase 6)
**Spec:** `docs/spec/offline-first.md` Phase 6 (audit note S4).

## Purpose

One-at-a-time conflict resolution UI for the offline outbox. When a queued
mutation replays and the server returns 409, the entry transitions to
`status:'conflict'` in IndexedDB. This component surfaces the head of the
conflict queue and lets the user resolve it.

## Why not one modal per conflict

Audit S4: a user with 10 conflicting items must not see 10 stacked dialogs.
The center renders only the head; resolving advances to the next; the badge
keeps the live count visible the whole time. Conflicts persist in IDB across
reloads (they're `OutboxEntry` rows), so closing the tab and reopening
restores the same queue.

## Resolution semantics

- **Keep local** — rewrites `If-Match` to the latest server version pulled
  from `conflictState.serverData.newUpdatedAt` (or `updatedAt`). Status
  flips back to `pending` and a drain is triggered. The user's local edit
  wins.
- **Discard** — `removeById`. User accepts server state.

Both actions are wired through `OutboxContext.resolveConflict`.

## Mount

Mounted by `SyncStatusIndicator` (the floating badge). Clicking the badge
when `conflictCount > 0` opens this dialog. Layout-level mount unnecessary.

## Future

Phase 6b ideas (not in this PR):
- Inline diff between local body and server data.
- Per-conflict "open the related screen" deep link.
- Merge resolution for routes that support it (e.g. set unions).
