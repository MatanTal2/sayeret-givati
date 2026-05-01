# guardScheduleService.ts

**File:** `src/lib/db/server/guardScheduleService.ts`

Admin-SDK service for the `guardSchedules` Firestore collection. All writes go through here — there is no client-write path. Reads are also exposed for API routes; the client SDK reads via `src/lib/db/guardScheduleClient.ts`.

## Operations

| Function | Behaviour |
|----------|-----------|
| `serverCreateGuardSchedule(input)` | Validate → run `generateSchedule()` → persist doc → write `GUARD_SCHEDULE_CREATED` audit row. |
| `serverGetGuardSchedule(id)` | Owner-agnostic read; returns `null` for missing or soft-deleted docs. |
| `serverListMyGuardSchedules(uid, { limit })` | Owner-only list, ordered by `createdAt desc`, soft-deleted filtered out. |
| `serverUpdateGuardSchedule(id, patch)` | Update title and/or assignments; recomputes stats; ownership enforced; audit log retains prior assignments snapshot. |
| `serverDeleteGuardSchedule(id, actorUid, actorName)` | Soft delete via `deletedAt`; ownership enforced. |
| `serverShareGuardScheduleCopy({ sourceId, recipientUid, actorUid, actorName })` | Clone-on-share. Creates a fresh doc owned by recipient with `sourceScheduleId` set + cleared locks. Notifies recipient (`GUARD_SCHEDULE_SHARED`). Both sides audited. |

## Errors

`GuardScheduleValidationError` carries an HTTP-aware `status` (400 / 403 / 404). API routes map to JSON responses.

## Side effects

- **Audit log** entries written via `serverCreateActionLog` after the primary write. Equipment-shaped fields (`equipmentId`, `equipmentDocId`, `equipmentName`) are reused as a generic action-log payload — `equipmentDocId` holds the schedule id.
- **Notifications** on share via `serverCreateNotification`; carries `relatedGuardScheduleId` for deep-link.

## Visibility model

Schedules are private to the creator. Sharing does **not** grant cross-user reads — instead, a brand-new owned doc is created on the recipient's side. The Firestore rule on `guardSchedules/{id}` enforces this with `resource.data.createdBy == request.auth.uid`.
