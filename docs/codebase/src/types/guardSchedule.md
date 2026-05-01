# guardSchedule.ts (types)

**File:** `src/types/guardSchedule.ts`

Domain types for the guard schedule generator. Algorithm types live alongside persistence types so the algorithm module can be imported without pulling Firestore types.

## Highlights

- `ISODateTime` — local datetime stamp, format `YYYY-MM-DDTHH:mm`. No timezone is applied (intentional — guard rosters are local-time artifacts).
- `HeadcountWindow` — `{ startHour, endHour, headcount }`. `endHour=24` represents end-of-day; `startHour > endHour` indicates midnight wrap.
- `RosterPerson` — `source` distinguishes Firestore-picked users (id = uid) from free-text entries (id = slug).
- `ScheduleAlgorithm` — union of `round_robin | random_fair | constraint_aware`.
- `GuardSchedule` — top-level Firestore doc. `sourceScheduleId` is set on clone-on-share copies; `deletedAt` marks soft deletion.

## I/O contracts

- `GenerationInput` / `GenerationResult` — pure-function shapes consumed by the algorithm and re-used as parts of the persisted document.
- `CreateGuardScheduleInput`, `UpdateGuardSchedulePatch`, `ShareGuardScheduleInput` — service-level write shapes.

See the spec at `docs/spec/guard-scheduler.md`.
