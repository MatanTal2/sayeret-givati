# page.tsx (Tools)

**File:** `src/app/tools/page.tsx`
**Status:** Active

## Purpose

Additional tools page (`/tools`). Grid of standalone HTML tools — each opens in-app and is downloadable as a single offline HTML file.

## Tools

| id | Title | Route | Download |
|----|-------|-------|----------|
| `convoy` | מארגן שיירות | `/tools/convoy` | `/tools/hmmwvConvoy.html` |
| `logistics` | דרישות מל״מ | `/tools/logistics` | `/tools/logistics.html` |
| `guard-scheduler` | מחולל שמירות | `/tools/guard-scheduler` | `/tools/guard-scheduler.html` |

## Design

Cards share a unified brand gradient (`from-primary-600 to-primary-800`) instead of per-tool palettes — keeps the page on the design-system tokens and avoids ad-hoc `emerald-*` / `purple-*` usage.

Wrapped in `AuthGuard` + `AppShell`.
