# cache.ts

**File:** `src/lib/cache.ts`
**Status:** Deprecated (Phase 7 of offline-first migration, audit S6)

## Purpose

Legacy localStorage soldier-status cache. Superseded by the Phase 3 SW
runtime cache (for `/api/soldier-status` reads) and the Phase 1 Firestore
persistent cache (for direct Firestore reads).

## Current behavior

`getCachedData` / `setCachedData` are **no-ops**. They return `null` /
ignore writes. First call from each tab runs a one-time cleanup:

1. Read `sayeret-givati-soldiers-data` from `localStorage`.
2. Log `[cache] legacy_cache_migrated { hadEntry: true|false }`.
3. Remove the legacy key.
4. Set `sayeret-givati-legacy-cache-migrated` to the timestamp.

Subsequent calls skip the cleanup (gated on the telemetry key).

## Removal plan

30 days after Phase 7 ships, drop the file entirely and delete the import
from `src/hooks/useSoldierStatus.ts`. The replacement layer (SW + Firestore
persistent cache) handles the same fast-paint use case without
LRU-collision risk that single-key localStorage carried.
