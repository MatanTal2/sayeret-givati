# db/server/policyHelpers.ts

**File:** `src/lib/db/server/policyHelpers.ts`
**Status:** Active (Phase 4)

## Purpose

Small glue module so API routes can run `equipmentPolicy` checks. Lifts a client-supplied `actor` payload into the `EnhancedAuthUser` shape the policy module expects, and fetches equipment docs by id.

## Exports

| Export | Purpose |
|--------|---------|
| `ApiActor` | Interface: `{ uid, userType, teamId?, unitId?, displayName? }` |
| `validateActor(unknown) => ApiActor` | Throws if missing `uid` / `userType`. |
| `actorToAuthUser(actor) => EnhancedAuthUser` | Minimal conversion for policy calls. |
| `fetchEquipmentForPolicy(equipmentDocId) => Promise<Equipment>` | Admin-SDK read; throws `Equipment not found`. |

## Known Gap

- `actor.uid` / `actor.userType` come from the client body. Token verification via `firebase-admin/auth` is **not yet wired up** — tracked in `docs/spec/firestore-refactor.md` as part of the hybrid-architecture hardening.
