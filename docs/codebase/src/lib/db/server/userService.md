# userService.ts (server)

**File:** `src/lib/db/server/userService.ts`
**Status:** Active

## Purpose

Server-side (firebase-admin) writes against `users/{uid}`. Used by `PATCH /api/users/profile` for self-service profile edits. Identity-anchor fields (phone, email, role/permissions) are intentionally NOT writable here — those flow through dedicated routes with stricter proofs.

## Exports

| Symbol | Shape | Notes |
|---|---|---|
| `serverUpdateUserProfile(uid, updates, actorUid?)` | `Promise<void>` | Whitelisted field write. No-ops when the patch yields zero allowed keys. Stamps `updatedAt` (server time). |
| `InvalidProfileUpdateError` | `Error` subclass | Thrown when `communicationPreferences` fails shape validation. Route maps to HTTP 400. |
| `ProfileUpdatePayload` | TS type | Shape accepted by `serverUpdateUserProfile`. |

## Writable surface

### String fields (top-level)

`teamId`, `profileImage`, `enlistmentCycle`, `address`. Unknown keys are silently dropped — keeps the route forgiving when newer clients send fields the server doesn't recognise.

### `communicationPreferences` (nested booleans)

Only the keys listed in `COMM_PREF_BOOLEAN_KEYS` are accepted:
`emailNotifications`, `equipmentTransferAlerts`, `systemUpdates`, `schedulingAlerts`, `emergencyNotifications`.

Validation rejects (`InvalidProfileUpdateError`):
- non-object payloads (`null`, arrays, primitives),
- keys outside the allowlist,
- non-boolean values.

Writes use **dotted field paths** (`communicationPreferences.emailNotifications`) so a partial patch only touches the toggled key — sibling flags persist. The service also writes `communicationPreferences.lastUpdated` (`FieldValue.serverTimestamp()`) and `communicationPreferences.updatedBy` (the `actorUid` arg; defaults to the subject `uid` when omitted).

## Explicit non-writable fields

`phoneNumber` is rejected at the route layer (400) before the service is called — see `src/app/api/users/phone-change/*` for the dedicated OTP-gated flow. The route's pre-service guard is intentionally noisy (loud, not silent) so a client mistakenly sending `phoneNumber` learns immediately instead of seeing a 200 with no persisted change.

`userType`, `permissions`, `role`, `status`, `militaryPersonalNumberHash`, `joinDate`, `createdAt`, `deletionRequestedAt` — none are in the whitelist and would be silently dropped if a client tried to set them.

## Tests

`src/lib/db/server/__tests__/userService.test.ts` locks in: no-op on empty patch, string-field write shape, dotted-path comm-pref write, actor-uid default, validation rejects (unknown key, non-boolean, non-object), and unknown-top-level-key drop.
