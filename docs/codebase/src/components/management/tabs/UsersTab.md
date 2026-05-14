# UsersTab.tsx

**File:** `src/components/management/tabs/UsersTab.tsx`
**Status:** Active

## Purpose

Admin users management — mobile-priority expandable rows (bug #21).

Replaces the prior 6-column desktop-only table with a scrollable list where each row is a card. Compact card shows status dot + initials + name + pending-registration badge + role line; clicking the card expands a panel revealing email, rank, role, team, phone, status, and edit/delete actions.

## Data source

Uses `useUsersAndPersonnel()` — a merged view of `users` ∪ `authorized_personnel`. Unregistered soldiers (those who have a pre-authorization entry but haven't completed signup) appear in the list with the same shape as registered users; their phone falls back to `authorized_personnel.phoneNumber` when `users.phoneNumber` is missing.

Other consumers that need registered-only / email-able rows (`EmailTab`, `CustomUserSelectionModal`, ammunition page) keep using the existing `useUsers` hook unchanged.

## Registered-vs-unregistered indicator (Council outcome)

A 4-agent Council compared:
1. name-side dot (color)
2. leading icon glyph (Hourglass)
3. faint row tint
4. suffix text-badge

Three out of four agents converged on **asymmetric** rendering — show nothing on the common registered case, show a signal only on the anomaly. The picked variant is a small `bg-warning-100 text-warning-800` text-badge reading `ממתין` next to the name, reusing the `VIEW_PENDING_BADGE` constant from bug #4's registration badge work (vocabulary consistency). Plain text removes the need for SR-only fallback, and the "צ" tag pattern in `EquipmentTable` is the existing precedent for inline text-badges.

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Free-text search over name / email / phone |
| `selectedRole` | `RoleFilter` | Role filter dropdown |
| `selectedStatus` | `StatusFilter` | Status filter dropdown |
| `expandedHash` | `string \| null` | Currently expanded row (one-at-a-time pattern, mirrors `EquipmentTable`) |

## Firebase Operations

- **Read:** `useUsersAndPersonnel()` → fetches `users` and `authorized_personnel` in parallel.

## Visual contract

- List container is `max-h-[28rem] overflow-y-auto` so the section keeps the page short on long admin views.
- Status is encoded twice for redundancy: a status dot in the compact row + a colored pill in the expanded panel.
- Role displays with a tone-coded pill (`danger` for admin, `info` for managers/officers, `neutral` otherwise) — preserves the prior color vocabulary.
- Stats grid below the list uses 4 cards: total / active / inactive / pending-registration. The pending card uses the same `STATS_PENDING` constant the admin dashboard uses.

## Known Issues

- `getTeamFromRole` is still a derived placeholder (mapping `UserRole` to a Hebrew team category label). The real `FirestoreUserProfile.teamId` exists but isn't resolved to a team name here yet — same scope deferral as the prior tab.
- Edit / delete actions are still placeholder buttons (no handlers). Hook into `AdminFirestoreService.updateAuthorizedPersonnel` once the admin write flow is wired into management.
