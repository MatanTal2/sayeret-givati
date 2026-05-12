# utils/navigationUtils.ts

**File:** `src/utils/navigationUtils.ts`
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
| `routeRequiresManagementAccess` | `(path) => boolean` | Check if route needs management role |

## Route status

Active (`available: true`): `/status`, `/equipment`, `/ammunition`, `/ammunition/training`, `/phone-book`, `/guard-scheduler`, `/tools`.
Coming soon (`available: false`): `/tracking`, `/logistics`, `/convoys`.

Training is exposed both as a top-level feature card and via the link inside `/ammunition`.
