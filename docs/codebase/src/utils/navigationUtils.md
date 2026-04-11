# utils/navigationUtils.ts

**File:** `src/utils/navigationUtils.ts`  
**Lines:** 166  
**Status:** Active

## Purpose

Feature routes and navigation menu configuration. Defines all app routes with metadata (auth required, coming soon, icons, descriptions).

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `FeatureRoute` | interface | Route definition with path, label, icon, requiresAuth, comingSoon |
| `getFeatureRoutes` | `() => FeatureRoute[]` | All feature routes |
| `getMenuItems` | `() => MenuItem[]` | Menu items for hamburger/sidebar |
| `routeRequiresAuth` | `(path) => boolean` | Check if route needs auth |
| `routeIsComingSoon` | `(path) => boolean` | Check if route is placeholder |
