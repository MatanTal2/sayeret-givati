# usefulLinksService.ts

**File:** `src/lib/usefulLinksService.ts`
**Status:** Active

## Purpose

Read-only client service for admin-curated home-page quick links. Entries are seeded via the Firestore console until an admin CRUD UI ships.

## Exports

| Function | Purpose |
|----------|---------|
| `getUsefulLinks()` | Fetch all links ordered by the `order` field ascending |

## Firestore schema

Collection: `useful_links` (constant: `COLLECTIONS.USEFUL_LINKS`)

| Field | Type | Notes |
|-------|------|-------|
| `label` | `string` | Display text |
| `url` | `string` | Absolute URL or `/path` for internal |
| `icon` | `string?` | Optional emoji or short string |
| `order` | `number?` | Sort order |
| `isExternal` | `boolean?` | If omitted, inferred from whether `url` starts with `/` |
