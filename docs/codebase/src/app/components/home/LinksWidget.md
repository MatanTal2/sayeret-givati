# LinksWidget.tsx

**File:** `src/app/components/home/LinksWidget.tsx`
**Status:** Active

## Purpose

Home-page widget that renders admin-curated quick links as chips.

## Data flow

- Reads via `getUsefulLinks()` in `src/lib/usefulLinksService.ts`
- Data lives in the `useful_links` Firestore collection, ordered by the `order` field
- Writes are currently seeded manually via the Firestore console — admin CRUD UI is a follow-up
- Links with `isExternal: true` (default for non-relative URLs) open in a new tab
