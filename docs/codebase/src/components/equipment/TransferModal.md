# TransferModal.tsx

**File:** `src/components/equipment/TransferModal.tsx`  
**Lines:** ~250  
**Status:** Active

## Purpose

Modal for initiating an equipment transfer request. User searches for a target user (debounced, 300ms, min 2 chars via `searchUsers`), selects from dropdown, enters a reason and optional note. On submit, creates a transfer request via `createTransferRequest` and logs the action via `createActionLog` / `ActionLogHelpers`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `equipment` | `Equipment \| null` | ✅ | Equipment being transferred |
| `onTransferSuccess` | `() => void` | ❌ | Called after successful transfer request |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `TransferFormData` | `{ toUserId, toUserName, reason, note }` |
| `isSubmitting` | `boolean` | Submit in progress |
| `errors` | `Partial<TransferFormData>` | Per-field validation errors |
| `searchQuery` | `string` | User search input |
| `searchResults` | `UserSearchResult[]` | Results from `searchUsers` |
| `isSearching` | `boolean` | Search in progress |
| `showUserDropdown` | `boolean` | Dropdown visibility |

## Firebase Operations

- **Write:** `createTransferRequest()` — writes to `transferRequests` collection
- **Write:** `createActionLog()` — writes to `actionsLog` collection
- **Read:** `searchUsers()` — reads from `users` collection

## Validation

- Target user must be selected (not empty `toUserId`)
- Reason is required
- Cannot transfer to self (`toUserId !== user.uid`)

## Notes

- Console.log statements for search debugging — should be removed for production.
- Click-outside handler for dropdown uses `mousedown` event listener.
- Resets form completely when modal opens/closes.
