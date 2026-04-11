# communicationService.ts

**File:** `src/lib/communicationService.ts`  
**Lines:** 169  
**Status:** Active

## Purpose

Communication preference management for notifications. Updates user notification preferences (email, SMS, push) in the `users` collection.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `UpdatePreferencesRequest` | interface | Preference update request shape |
| `UpdatePreferencesResult` | interface | Result with success flag |
| `CommunicationService` | class (static) | `updatePreferences()`, `getPreferences()`, `resetToDefaults()` |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `users` | `updateDoc` | `updatePreferences()` (nested `communicationPreferences` field) |
