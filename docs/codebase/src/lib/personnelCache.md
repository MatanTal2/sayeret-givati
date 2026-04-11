# personnelCache.ts

**File:** `src/lib/personnelCache.ts`  
**Lines:** 99  
**Status:** Active

## Purpose

Client-side localStorage cache for authorized personnel data with 1-day TTL. Prevents repeated Firestore reads during registration verification.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `PersonnelCacheData` | interface | Cached personnel entry shape |
| `PersonnelCache` | class (static) | `get()`, `set()`, `clear()`, `isExpired()` methods |
