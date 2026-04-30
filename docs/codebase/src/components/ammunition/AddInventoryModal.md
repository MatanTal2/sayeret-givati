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
- `team` → `holderType=TEAM, holderId=actor.teamId`. The team is chosen via a
  `Select` whose options come from `systemConfig.teams`. The actor's own
  `teamId` is always present in the option list, even if it is missing from
  the configured list.
  - **Admins / system managers** can change the team to any configured value.
  - **Managers / team leaders** see the picker but it is disabled — locked
    to their own team. A short helper note explains why.
- `user` → `UserSearchInput` typeahead.

## Template picking

Two-step picker:

1. **Subcategory** `Select` with the fixed `AMMUNITION_SUBCATEGORIES` list.
   Required before any template is shown. Clearable.
2. **Template** `Select` filtered by the chosen subcategory. Disabled when
   no subcategory is picked or when the filtered list is empty.

The previous flat "long list of every template" picker was replaced because
it scaled poorly once many templates were configured.

## Notes

- Templates list is filtered client-side by allocation (USER/BOTH for plain
  users) and by subcategory. The server re-validates per-actor.
- BRUCE inputs include `bruceCount` + `openBruceState`. LOOSE_COUNT input is
  `quantity`. SERIAL input is the serial string.
