# Guard Schedule Generator (מחולל שמירות)

Production spec. Supersedes `docs/guard-scheduler-spec.md`, which is kept only as a historical pointer to this file.

## Goal

A one-off schedule generator that builds a fair, mostly-random guard roster for one or more posts over a defined date range. It is *not* a recurring scheduler.

## Delivery surfaces

| Surface | Location | State |
|---------|----------|-------|
| Online wizard | `/guard-scheduler` (Next.js) | Schedules persisted in Firestore |
| Offline tool  | `public/tools/guard-scheduler.html` | localStorage (5-list cap) |

The two share the same algorithm — `src/lib/guardSchedule/algorithm.ts` and the inlined hand-port in the HTML are kept in sync via the parity test `src/lib/__tests__/guardScheduleOfflineParity.test.ts`.

## Domain model

`src/types/guardSchedule.ts`

- **GuardPost** — name, defaultHeadcount, optional list of HeadcountWindows. Each window covers a span of hours (supports midnight wrap) and overrides default headcount in that range.
- **RosterPerson** — sourced from either `users` (uid as id) or free-text input (slugified name as id). Optional `blackoutHours` consumed by `constraint_aware`.
- **ScheduleConfig** — `startAt`/`endAt` (local datetime, no TZ), `shiftDurationHours` ∈ [0.5, 12], `algorithm`, optional `seed`.
- **GenerationInput / GenerationResult** — pure-function I/O. Result includes `shifts`, `assignments`, per-person `stats`, `fairnessScore = max−min shifts assigned`, and structured `warnings`.
- **GuardSchedule** — top-level Firestore doc: domain inputs + result snapshot + `createdBy` + optional `sourceScheduleId` (set on share-clone).

## Algorithm

`src/lib/guardSchedule/algorithm.ts`. Pure, no deps.

1. `expandShifts(posts, config)` — slices range into per-post buckets of `shiftDurationHours`. `requiredHeadcount` resolves by intersecting with windows (max in overlap; midnight wrap supported).
2. `generateSchedule(input)` — sorts shifts chronologically, walks them once. Per shift:
   - If an existing assignment is locked, keep it.
   - Else select N candidates per algorithm:
     - **round_robin** — rotating pointer over roster.
     - **random_fair** (default) — seeded shuffle once for tiebreak; per-shift pick by min-key `(shiftsAssigned ↑, lastShiftEnd ↓, shuffledIndex)`.
     - **constraint_aware** — `random_fair` after filtering blackout overlaps; falls back to full pool with `blackout_overrun` warning when filter empties below required.
   - Tracks counts and last-shift-end for downstream tie-break.
3. Determinism: same `(input, seed)` → byte-identical output (verified by parity test).

## Server service

`src/lib/db/server/guardScheduleService.ts`. Admin SDK only.

- `serverCreateGuardSchedule` — validates → runs algorithm server-side → persists doc → audit log.
- `serverGetGuardSchedule(id)`, `serverListMyGuardSchedules(uid)` — owner reads.
- `serverUpdateGuardSchedule(id, patch)` — assignments and/or title; recomputes stats; audit log keeps a (truncated) snapshot of prior assignments.
- `serverDeleteGuardSchedule(id, actorUid, name)` — soft delete via `deletedAt`.
- `serverShareGuardScheduleCopy({ sourceId, recipientUid, actorUid, actorName })` — clones the doc with a fresh id owned by the recipient; locks cleared; `sourceScheduleId` points to the original. Notifies recipient (`NotificationType.GUARD_SCHEDULE_SHARED`). Both sides audited (`GUARD_SCHEDULE_SHARED_FROM` / `GUARD_SCHEDULE_SHARED_TO`).

Validation errors throw `GuardScheduleValidationError` with HTTP-status-aware codes (400 / 403 / 404). API routes map to JSON responses.

## API surface

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/guard-schedules` | `POST` | Create |
| `/api/guard-schedules` | `GET` | List my schedules |
| `/api/guard-schedules/[id]` | `GET` | Read (owner-only) |
| `/api/guard-schedules/[id]` | `PATCH` | Update assignments / title |
| `/api/guard-schedules/[id]` | `DELETE` | Soft delete |
| `/api/guard-schedules/[id]/share` | `POST` | Clone-on-share to a recipient uid |

All bearer-gated via `getActorOrError`.

## UI

`src/app/guard-scheduler/`:

- `page.tsx` (root wizard, `/guard-scheduler`)
- `[id]/page.tsx` (open saved schedule, `/guard-scheduler/<id>`)
- `components/GuardSchedulerWizard.tsx` — tabbed wizard (Posts → Personnel → Config → Preview → Export)
- `components/PostsEditor.tsx` + `HeadcountWindowEditor.tsx`
- `components/PersonnelPicker.tsx` (Firestore users w/ search) + `FreeTextNameInput.tsx` (paste box, dedup)
- `components/ScheduleConfigForm.tsx`
- `components/GeneratedScheduleTable.tsx` + `ManualSwapDialog.tsx`
- `components/ExportPanel.tsx` (copy/download/save/share/offline link)
- `components/ShareScheduleDialog.tsx` (recipient picker)
- `components/useGuardSchedulerDraft.ts` (localStorage draft, schema-versioned)

All Hebrew strings via `TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER`. Tailwind tokens only. Native `<input type="datetime-local">` (zero deps).

## Permissions

- Any authenticated user may create/edit/share their own schedules.
- Schedules are private to `createdBy`; Firestore rule denies cross-user reads.
- Sharing is **clone-on-share** — recipient ends up with their own owned copy plus an in-app notification, never read access to the original. This avoids cross-user permissions complexity at the cost of duplicating storage (intended).

## Notifications

`NotificationType.GUARD_SCHEDULE_SHARED`. Notification doc carries `relatedGuardScheduleId`; `NotificationItem.tsx` resolves it to `/guard-scheduler/<id>`.

## Out of scope

Recurring schedules, per-assignment notifications, mobile push, calendar (.ics) export, real-time multi-user editing, PDF export.

## Verification

See section M of the implementation plan; automated suites:

```
npm run lint
npm test -- guardSchedule
npm run build
```

Manual smoke (local dev): create a schedule with mixed posts/headcount windows, swap an assignee, lock it, regenerate keep-locks, copy text, download CSV, save to cloud, share to a second test account, open the offline HTML directly from disk, save 6 lists and confirm FIFO eviction.
