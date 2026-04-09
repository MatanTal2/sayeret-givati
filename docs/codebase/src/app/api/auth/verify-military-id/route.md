# route.ts (verify-military-id)

**File:** `src/app/api/auth/verify-military-id/route.ts`
**Lines:** 100
**Status:** Active

## Purpose

API route `POST /api/auth/verify-military-id`. Checks whether a given military personal number exists in the `authorized_personnel` Firestore collection. Uses SHA-256 hashing for O(1) Firestore document lookup. Returns the personnel record details (name, rank, unit) if found and not yet registered.

## Exports / Public API

- `POST(request: NextRequest)` — Next.js route handler.

## Request Body

```json
{ "militaryId": "1234567" }
```

## Response (success)

```json
{
  "success": true,
  "data": { "firstName": "...", "lastName": "...", "rank": "...", "unit": "..." }
}
```

## Firebase Operations

| Collection | Operation | Query |
|------------|-----------|-------|
| `authorized_personnel` | `getDoc` | Direct lookup by `SecurityUtils.hashMilitaryId(cleanMilitaryId)` |

## Flow

1. Validate `militaryId` is present and a string
2. Strip non-numeric characters
3. Validate length is 5–7 digits
4. Hash the ID with `SecurityUtils.hashMilitaryId`
5. `getDoc` from `authorized_personnel` using hash as document ID
6. If not found → return `{ success: false, error: 'not authorized' }`
7. If `data.registered === true` → return error: already registered
8. If found and not registered → return personnel details

## Notes

- Makes direct Firestore calls in the API route (does not use `adminUtils` service functions). This is acceptable for a route handler but worth consolidating later.
- Uses `console.log` extensively — should be removed for production.
