# AddInventoryModal

**File:** `src/components/ammunition/AddInventoryModal.tsx`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Single dialog used to add a new inventory entry from any host. It picks the
right form fields based on the selected template's `trackingMode`.

## Props

| Prop | Purpose |
|------|---------|
| `templates` | Available templates. Filtered to USER+BOTH allocations for plain users. |
| `onClose` | Closes the modal. |
| `onSubmitStock(payload)` | BRUCE / LOOSE_COUNT submission. |
| `onSubmitItem(payload)` | SERIAL submission. |
| `allowHolderPicker?` | When true and the user is TL+, exposes holder picker (self/team/user). |

## Holder choice

- `self` → `holderType=USER, holderId=actor.uid`. Default.
- `team` → `holderType=TEAM, holderId=actor.teamId` (editable text input — useful for managers picking another team).
- `user` → `UserSearchInput` typeahead.

## Notes

- Templates list is filtered client-side; the server re-validates per-actor.
- BRUCE inputs include `bruceCount` + `openBruceState`. LOOSE_COUNT input is
  `quantity`. SERIAL input is the serial string.
