# db/core.ts

**File:** `src/lib/db/core.ts`  
**Lines:** 56  
**Status:** Active

## Purpose

Generic typed helpers for common Firestore operations using the Admin SDK. Thin layer — complex multi-document transactions stay in domain services.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `getDocById<T>` | `(collection, docId) => Promise<(T & { id }) \| null>` | Read single document |
| `createDoc<T>` | `(collection, data, docId?) => Promise<string>` | Create document (auto-ID or specified), adds `createdAt` timestamp |
| `updateDoc<T>` | `(collection, docId, data) => Promise<void>` | Update document fields, adds `updatedAt` timestamp |

## Notes

- All functions use `adminDb` from `./admin.ts` — server-side only.
- Auto-adds `createdAt` on create and `updatedAt` on update via `FieldValue.serverTimestamp()`.
