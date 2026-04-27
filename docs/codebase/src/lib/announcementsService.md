# announcementsService.ts

**File:** `src/lib/announcementsService.ts`
**Status:** Active

## Purpose

Service layer for unit announcements. Reads and writes go through the Firestore client SDK — consistent with the current codebase state (hybrid migration to server-side writes is ongoing per `docs/spec/firestore-refactor.md`).

Write permissions are enforced server-side via `firestore.rules`.

## Exports

| Function | Purpose |
|----------|---------|
| `getRecentAnnouncements(limit = 3)` | Fetch N most recent announcements ordered by `createdAt desc` |
| `createAnnouncement(input, author)` | Add a new announcement (client SDK write) |
| `deleteAnnouncement(id)` | Remove an announcement by ID |

## Firestore schema

Collection: `announcements` (constant: `COLLECTIONS.ANNOUNCEMENTS`)

| Field | Type | Notes |
|-------|------|-------|
| `title` | `string` | Required |
| `body` | `string` | Required |
| `authorId` | `string` | Firebase Auth UID |
| `authorName` | `string` | Display name at post time |
| `createdAt` | `Timestamp` | Server timestamp |
