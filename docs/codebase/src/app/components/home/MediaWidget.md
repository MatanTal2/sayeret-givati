# MediaWidget.tsx

**File:** `src/app/components/home/MediaWidget.tsx`
**Status:** Active

## Purpose

Home-page widget that renders unit media (photos and videos) as a 2×2 thumbnail grid beneath the Announcements widget. Clicking a tile opens a lightbox.

## Data flow

- Reads via `getRecentUnitMedia()` in `src/lib/unitMediaService.ts`
- Data lives in the `unit_media` Firestore collection, ordered by `createdAt` desc
- Entries are seeded via the Firestore console — admin upload UI is a follow-up
- Image/video URLs render through `next/image` with `unoptimized` so external hosts work without editing `next.config.js`

## Item schema

| Field | Type | Notes |
|-------|------|-------|
| `type` | `'image' \| 'video'` | Required |
| `url` | `string` | Full URL to the asset |
| `thumbnailUrl` | `string?` | Preview image for videos |
| `caption` | `string?` | Optional text overlay |
| `createdAt` | `Timestamp` | Server timestamp |
