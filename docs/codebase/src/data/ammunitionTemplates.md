# data/ammunitionTemplates.ts

**File:** `src/data/ammunitionTemplates.ts`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Source of truth for the **initial canonical** ammunition template set. Admins
seed the `ammunitionTemplates` collection from this file once via the
`seed_canonical` admin action; from then on Firestore wins.

## Why a code file (not a JSON config)

- Code-reviewable + versioned with the feature.
- Available to tests and local dev without depending on Firestore being live.
- Strong types — TypeScript catches a malformed seed at compile time.

## Shape

`CanonicalAmmunitionTemplateSeed` is `AmmunitionType` minus `id`, `status`,
`createdAt`, `updatedAt`, `createdBy`. The seed function fills those at write
time and forces `status: 'CANONICAL'`.

## Set

- 5 bullet variants (5.56 white/green/tracer, 7.62 tracer, 0.5 tracer) — BRUCE / TEAM / EXPLOSIVE
- Smoke + spray grenade — LOOSE_COUNT, BOTH/USER
- 3 launcher grenades (smoke, spray, light) — LOOSE_COUNT / USER / EXPLOSIVE
- 4 shoulder missiles (yated, holit, lao, metador) — SERIAL / TEAM / EXPLOSIVE
- Light mine — SERIAL / TEAM / EXPLOSIVE
- נר עשן (TEAM/EXPLOSIVE) and מעיל רוח (TEAM/GRABBABLE) — LOOSE_COUNT / OTHER

Edit this file when the unit's standard issue changes; re-running
`seedCanonical` is idempotent on `name`.
