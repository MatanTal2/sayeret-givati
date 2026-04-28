# SystemStats.tsx

**File:** `src/app/admin/components/SystemStats.tsx`
**Lines:** 257
**Status:** Active

## Purpose

System statistics dashboard tab. Displays a 4-card stats grid (Total / Registered / Pending / Recently Added) plus a Detailed Information panel and a Recent Activity feed (latest 5 personnel with registration badge). Loads personnel data via `usePersonnelManagement` using cached data first; has a manual refresh button that forces a Firestore fetch.

## Props

None.

## State

| State | Type | Purpose |
|-------|------|---------|
| `stats` | `{ totalPersonnel, recentlyAdded, registeredCount, pendingCount, lastUpdated }` | Derived stats from personnel list. `registeredCount` / `pendingCount` come from filtering the `registered` boolean on each `authorized_personnel` doc (bug #4 fix). |
