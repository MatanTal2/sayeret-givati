# lib/ammunition/subcategories.ts

**File:** `src/lib/ammunition/subcategories.ts`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Fixed taxonomy of ammunition subcategories. Six entries, hardcoded — no
Firestore lookup. Equipment uses a Firestore-backed category system; ammunition
intentionally does not, because the list is short, fixed, and tightly coupled
to the unit's standard issue.

## Exports

| Export | Purpose |
|--------|---------|
| `AMMUNITION_SUBCATEGORIES` | Readonly tuple of six subcategory keys. |
| `isAmmunitionSubcategory(value)` | Type guard for narrowing unknown input to `AmmunitionSubcategory`. |

## Hebrew labels

Live in `src/constants/text.ts → FEATURES.AMMUNITION.SUBCATEGORIES`. Keep keys
in sync with the union type in `src/types/ammunition.ts`.
