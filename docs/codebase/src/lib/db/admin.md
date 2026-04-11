# db/admin.ts

**File:** `src/lib/db/admin.ts`  
**Lines:** 37  
**Status:** Active

## Purpose

Firebase Admin SDK initialization. Parses `GOOGLE_SERVICE_ACCOUNT_JSON` from environment (supports both raw JSON and base64-encoded), initializes the admin app as a singleton, and exports the admin Firestore and Auth instances.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `adminDb` | `Firestore` (admin) | Admin Firestore instance for server-side writes |
| `adminAuth` | `Auth` (admin) | Admin Auth instance for server-side auth operations |

## Notes

- Singleton pattern: checks `getApps()` before initializing.
- Only usable in server contexts (Server Actions, API routes) — never import in client components.
