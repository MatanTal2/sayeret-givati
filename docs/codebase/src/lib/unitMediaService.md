# unitMediaService.ts

**File:** `src/lib/unitMediaService.ts`
**Status:** Active

## Purpose

Read-only client service for unit media (photos and videos shown on the home page). Entries are seeded via the Firestore console until an admin upload UI ships.

## Exports

| Function | Purpose |
|----------|---------|
| `getRecentUnitMedia(limit = 4)` | Fetch N most recent media items ordered by `createdAt` desc |

## Firestore schema

Collection: `unit_media` (constant: `COLLECTIONS.UNIT_MEDIA`)

| Field | Type | Notes |
|-------|------|-------|
| `type` | `'image' \| 'video'` | Required |
| `url` | `string` | Asset URL |
| `thumbnailUrl` | `string?` | Optional preview for videos |
| `caption` | `string?` | Optional caption |
| `createdAt` | `Timestamp` | Server timestamp |
