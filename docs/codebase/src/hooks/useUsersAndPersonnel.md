# useUsersAndPersonnel.ts

**File:** `src/hooks/useUsersAndPersonnel.ts`
**Status:** Active

## Purpose

Returns a merged view of the `users` and `authorized_personnel` collections for the admin `UsersTab` (bug #21 — table needed to surface unregistered soldiers and pull phone from either collection).

Each row carries a `registered: boolean` flag so the UI can render a `ממתין` ("pending") badge on rows that exist in `authorized_personnel` but not yet in `users`.

## Why not extend `useUsers`?

`useUsers` already feeds `EmailTab`, `CustomUserSelectionModal`, and the ammunition page — all of which need email-addressable, registered-only rows. Pulling unregistered personnel into that list would silently break those callers (no email to send to / no `uid` to grant permission to). A separate hook keeps the contract clean.

## Join key

`authorized_personnel` doc ID == `militaryPersonalNumberHash`. `FirestoreUserProfile.militaryPersonalNumberHash` references the same value. The hook builds a `Map<hash, FirestoreUserProfile>` from the `users` snapshot, then walks `authorized_personnel` and joins each row.

Edge case: a `users` doc with no matching `authorized_personnel` row (unusual but possible during data migrations) is still emitted as a registered row, with `team` / `roleDisplay` derived from `users.role`.

## Field resolution

Each `UserWithRegistration` field uses `users` first, falling back to `authorized_personnel`:

| Field | Source priority |
|---|---|
| `uid` | `users.uid` → `null` if unregistered |
| `email` | `users.email` → `authorized_personnel.email` → `null` |
| `phoneNumber` | `users.phoneNumber` → `authorized_personnel.phoneNumber` → `''` |
| `rank` | `users.rank` → `authorized_personnel.rank` → `'לא מוגדר'` |
| `role` | `users.role` → `authorized_personnel.approvedRole` → `UserRole.SOLDIER` |
| `status` | `users.status` → `authorized_personnel.status` → `'active'` |
| `registered` | `users` doc present AND `authorized_personnel.registered !== false` |

`roleDisplay` is derived from `role` via the `ROLE_DISPLAY` lookup table.

`team` resolves through `resolveTeam(teamId, role)`:
1. If the joined `users.teamId` is set and non-blank, that value is used verbatim (matches `systemConfig/main.teams`).
2. Otherwise — including every unregistered personnel row, since `authorized_personnel` docs don't carry a team field today — falls back to a role-bucket via `TEAM_FROM_ROLE` (e.g. SOLDIER → `כללי`, TEAM_LEADER → `מפקדי צוות`).

Regression coverage in `src/hooks/__tests__/useUsersAndPersonnel.test.tsx`. The bug fixed there: the original implementation called `teamFromRole(role)` unconditionally, so every soldier with a real `teamId` rendered as `כללי` in the management UsersTab.

## Sort

Unregistered rows sort *after* registered rows. Within each group, the order is `lastName.localeCompare(b.lastName, 'he')` then `firstName.localeCompare(...)`.

## Returns

```ts
interface UseUsersAndPersonnelReturn {
  rows: UserWithRegistration[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

`refresh()` re-fetches both collections in parallel. The hook fires once on mount via a `useEffect` calling `refresh`.

## Firebase Operations

- **Read** `users` collection (full snapshot).
- **Read** `authorized_personnel` collection (full snapshot).

Both reads happen in parallel via `Promise.all`. No writes.
