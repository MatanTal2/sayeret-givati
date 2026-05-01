# guard-scheduler.html (offline tool)

**File:** `public/tools/guard-scheduler.html`

A single-file, self-contained version of the guard schedule generator. No network, no Firebase. Designed to work directly off the filesystem (`file://`).

## Capabilities

- Same wizard steps as the online version: posts → personnel → config → preview → export.
- Up to **5 saved lists** in `localStorage`, key `guard_scheduler_saved_v1`, schema `{ version: 1, items: SavedItem[] }`. FIFO eviction beyond 5; safe-parse with reset on corruption.
- Export: copy text, download `.txt`, download `.csv` (UTF-8 BOM).
- Linked from the online `ExportPanel` ("הורד גרסת אופליין").

## Algorithm parity

The algorithm is hand-ported from `src/lib/guardSchedule/algorithm.ts` and bracketed by `// @begin-algorithm` / `// @end-algorithm` markers. The parity test in `src/lib/__tests__/guardScheduleOfflineParity.test.ts` extracts that block at test-time, runs both implementations on representative inputs, and asserts byte-identical output. Edits to the TS algorithm must be mirrored in the HTML or the test fails.

## Editing rules

- Keep CSS using brand-aligned colors (`--primary` mirrors `primary-600`).
- Preserve the algorithm-block markers; the parity test depends on them.
- No external scripts/styles — the file must remain self-contained.
