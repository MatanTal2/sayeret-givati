# cache.ts

**File:** `src/lib/cache.ts`  
**Lines:** 32  
**Status:** Active

## Purpose

Client-side localStorage caching utility for soldier data with a 12-hour TTL.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `getCachedData` | `() => CachedData \| null` | Returns cached data if within TTL, null otherwise |
| `setCachedData` | `(data: any) => void` | Saves data to localStorage with current timestamp |
