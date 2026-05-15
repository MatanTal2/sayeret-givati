# useSoldierStatus.ts

**File:** `src/hooks/useSoldierStatus.ts`
**Status:** Active

## Purpose

Loads + mutates the soldier-status roster against `/api/soldier-status`. Roster
is the join of `users` ∪ `authorized_personnel` plus the optional status overlay.

## Return Shape

```typescript
{
  soldiers: Soldier[];
  setSoldiers: (s: Soldier[]) => void;
  originalSoldiers: Soldier[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isUpdatingChanges: boolean;
  fetchSoldiers: (forceRefresh?: boolean) => Promise<void>;
  pushChangedStatuses: (changed: Soldier[]) => Promise<void>;
}
```

## Caching

The Service Worker runtime cache (offline-first Phase 3) covers
`/api/soldier-status` for offline / fast paint. The legacy in-hook localStorage
cache was retired in Phase 7 (PR #129); the SW + Firestore persistent cache
layers are now authoritative. Do not reintroduce a hook-level TTL — that
duplicates work the SW already does and reopens the staleness window
deliberately closed by the migration.

## Mutation

`pushChangedStatuses` PUTs each changed soldier individually to
`/api/soldier-status/[id]`. Small roster, low traffic — no batch endpoint.

## Tests

`src/hooks/__tests__/useSoldierStatus.test.tsx` covers mount-fetch, error
surface, no-cache-between-mounts (regression guard for the dropped legacy
cache branch), and `forceRefresh` flow.
