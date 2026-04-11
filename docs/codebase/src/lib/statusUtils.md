# statusUtils.ts

**File:** `src/lib/statusUtils.ts`  
**Lines:** 29  
**Status:** Active

## Purpose

Maps between raw and structured soldier status values (e.g., raw string status from Firestore to typed enum and back).

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `StatusMapping` | interface | Maps between raw and structured status |
| `mapRawStatusToStructured` | `(raw: string) => StructuredStatus` | Converts raw status string to structured format |
| `mapStructuredStatusToRaw` | `(status: StructuredStatus) => string` | Converts structured status back to raw string |
| `getAvailableStatuses` | `() => StatusMapping[]` | Returns all valid status mappings |
