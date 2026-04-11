# SystemStats.tsx

**File:** `src/app/admin/components/SystemStats.tsx`
**Lines:** 257
**Status:** Active

## Purpose

System statistics dashboard tab. Displays total authorized personnel count and recently-added count (last 7 days). Loads personnel data via `usePersonnelManagement` using cached data first. Has a manual refresh button that forces a Firestore fetch.

## Props

None.

## State

| State | Type | Purpose |
|-------|------|---------|
| `stats` | `{ totalPersonnel, recentlyAdded, lastUpdated }` | Derived stats from personnel list |
