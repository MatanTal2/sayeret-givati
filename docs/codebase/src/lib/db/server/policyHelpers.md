# db/server/policyHelpers.ts

**File:** `src/lib/db/server/policyHelpers.ts`
**Status:** Active

## Purpose

Small glue module so API routes can run `equipmentPolicy` checks against a verified server-side identity. The verified identity is built by `getActorFromRequest` in `auth.ts` from the bearer token, never from the request body.

## Exports

| Export | Purpose |
|--------|---------|
| `ApiActor` | Interface: `{ uid, userType, grants?, teamId?, displayName? }` |
| `actorToAuthUser(actor) => EnhancedAuthUser` | Lifts the server-trusted actor into the shape policy functions consume. |
| `fetchEquipmentForPolicy(equipmentDocId) => Promise<Equipment>` | Admin-SDK read; throws `Equipment not found`. |

## Notes

- `actor` fields are **server-trusted** — sourced from Firestore `users/<uid>` after `getAdminAuth().verifyIdToken()` succeeds. Body-supplied actors are no longer accepted.
- `actor.grants` carries time-limited role-bump grants (currently always `[]`; the issuance UI ships in a follow-up PR).
