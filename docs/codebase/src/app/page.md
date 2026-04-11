# page.tsx (Home)

**File:** `src/app/page.tsx`
**Lines:** 112
**Status:** Active

## Purpose

Home page (`/`). Renders a feature card grid showcasing all app features, a watermark logo, and a three-column footer with quick links, support, and version info. Feature route configuration is centralized in `navigationUtils.getFeatureRoutes()`. All UI text comes from `TEXT_CONSTANTS`.

## Exports / Public API

- `default HomePage` — Next.js page component, no props.

## State

None — stateless render.

## Notes

- Footer links to `/help` and `/contact` which do not exist yet.
- `dir="rtl"` is set on the wrapper div here instead of exclusively on `<html>`. This is redundant since the root layout already sets it on `<html>`.
- `Link` import from `next/link` is commented out.
