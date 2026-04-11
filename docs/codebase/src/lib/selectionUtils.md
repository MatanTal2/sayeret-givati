# selectionUtils.ts

**File:** `src/lib/selectionUtils.ts`  
**Lines:** 146  
**Status:** Active

## Purpose

State management utilities for soldier multi-selection across components. Provides functions to select all, none, toggle individual, and create handlers for batch operations.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `selectAllSoldiers` | `(soldiers) => Set<string>` | Select all soldier IDs |
| `selectNoneSoldiers` | `() => Set<string>` | Empty selection |
| `toggleSoldierSelection` | `(id, selected) => Set<string>` | Toggle one soldier |
| + handler creators | various | Create event handlers for selection operations |
