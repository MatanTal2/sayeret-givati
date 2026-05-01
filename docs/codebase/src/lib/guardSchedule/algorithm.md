# algorithm.ts

**File:** `src/lib/guardSchedule/algorithm.ts`
**Pure, dependency-free.** Bundled inline (hand-port) into `public/tools/guard-scheduler.html` — see parity test in `src/lib/__tests__/guardScheduleOfflineParity.test.ts`.

## Public surface

| Export | Purpose |
|--------|---------|
| `parseLocal`, `formatLocal` | Local-datetime ↔ ms helpers; no TZ shift. |
| `hashSeed`, `mulberry32` | FNV-1a 32-bit hash + mulberry32 PRNG. |
| `expandShifts(posts, config)` | Slice range into per-post `Shift[]`. |
| `generateSchedule(input)` | Run algorithm, return `GenerationResult`. |

## Algorithms

- `round_robin` — rotating pointer over roster.
- `random_fair` (default) — seeded Fisher-Yates for tiebreak order; per-shift selection by `(shiftsAssigned, lastShiftEnd, shuffledIndex)` ascending.
- `constraint_aware` — `random_fair` after filtering blackout overlaps; falls back to full pool when filter empties below required (`blackout_overrun` warning).

## Determinism

Same `(input, seed)` → byte-identical output. Parity test asserts this between TS module and the offline HTML JS port.

## Warnings

- `roster_too_small` — roster size < max required headcount.
- `cannot_meet_headcount` — per-shift candidate pool short.
- `blackout_overrun` — constraint filter would leave too few candidates; full pool used.

## Fairness

`fairnessScore = max(stats.shiftsAssigned) − min(stats.shiftsAssigned)`. Lower is fairer. With divisible roster size, `random_fair` produces ≤ 1 in normal conditions.
