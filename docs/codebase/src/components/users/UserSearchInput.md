# UserSearchInput

**File:** `src/components/users/UserSearchInput.tsx`

Reusable single-user typeahead. Used by `ForceOperationsTab` (target picker) and `ReportRequestTab` (USER scope).

## Props

| Prop | Type | Notes |
|------|------|-------|
| `value` | `UserSearchResult \| null` | Controlled selection. `null` shows the search input; non-null shows a chip with a clear button. |
| `onChange` | `(user: UserSearchResult \| null) => void` | Fired on select and clear. |
| `placeholder` | `string?` | Search input placeholder text. |
| `excludeUserIds` | `string[]?` | Filtered out of results — e.g. exclude the actor. |

## Behavior

- 300ms debounce.
- Hits `searchUsers(query, 10)` from `userService` once `query.length >= 2`.
- Closes on click outside.
- When a user is selected, the chip view replaces the search input. Clearing returns to search mode.
