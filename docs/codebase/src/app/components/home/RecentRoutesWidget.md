# RecentRoutesWidget.tsx

**File:** `src/app/components/home/RecentRoutesWidget.tsx`
**Status:** Active

## Purpose

Home-page widget showing the 2 most recently visited routes as a bullet list. Every route that uses `AppShell` (home, tools, equipment, profile, settings, management, etc.) contributes automatically via `AppShell`'s mount effect. Iframe tool subpages (`/tools/convoy`, `/tools/logistics`) track themselves explicitly since they don't use `AppShell`.

## Data flow

- Reads via `getRecentRoutes()` in `src/utils/recentRoutesStorage.ts`
- Storage key: `recent_routes` (localStorage, per-device)
- Max 10 entries buffered; widget slices to 2
- Home (`/`) is excluded from tracking

## Rendering

- Single `card-base` container with `Clock` icon header
- Bullet list (`list-disc`), each item: `• Title · time-ago` as a `Link`
- Empty state: prompt pointing to the feature grid
