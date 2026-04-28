# db/collections.ts

**File:** `src/lib/db/collections.ts`  
**Lines:** 21  
**Status:** Active

## Purpose

Central collection name constants for all Firestore collections. Single source of truth — all Firestore collection references must use these constants.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `COLLECTIONS` | `const object` | All collection names: `USERS`, `AUTHORIZED_PERSONNEL`, `EQUIPMENT`, `EQUIPMENT_TEMPLATES`, `TRANSFER_REQUESTS`, `ACTIONS_LOG`, `NOTIFICATIONS`, `CATEGORIES`, `SUBCATEGORIES`, `ADMIN_CONFIG`, plus ammunition / config collections |
| `CollectionName` | type | Union type of all collection name values |

## Notes

- Consolidates scattered collection name constants from `adminUtils.ts`, `equipmentService.ts`, `transferRequestService.ts`, `actionsLogService.ts`, `notifications.ts`, and `categories/constants.ts`.
- `OTP_SESSIONS` and `OTP_RATE_LIMITS` were removed when OTP migrated from Twilio to Firebase Phone Auth — Firebase manages session lifecycle in-memory via `confirmationResult`.
- Safe to import from both server and client code (plain string constants, no SDK dependency).
