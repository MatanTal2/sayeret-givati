# AmmunitionReportsSection

**File:** `src/components/management/tabs/ammunition/AmmunitionReportsSection.tsx`
**Status:** Active (Phase 5 — Ammunition feature)

## Purpose

Manager dashboard sub-section. Replaces the Phase 2 placeholder with the real
filtering + sortable table + CSV export. Mirrors `AuditLogsTab` in shape.

## Filters (all optional, ANDed)

- `from` / `to` — date range over `usedAt`. The `to` cap is treated as
  end-of-day (adds 24h) so a same-day filter still shows entries logged
  later in the day.
- `subcategory` — narrows the template dropdown and filters reports.
- `templateId` — exact match.
- `teamId` — substring match.
- `reporter` — substring match against `reporterName`.

## Sortable columns

`usedAt` (default desc), `reporterName`, `teamId`, `templateName`. Click
the header to toggle direction; switching column resets to a sensible
default direction (desc for date, asc for text).

## CSV export

Uses `downloadReportsCsv`. The button exports the **filtered + sorted** view,
not the full underlying list, so the file matches what's on screen. Default
filename is `ammunition-reports-YYYY-MM-DD.csv`.
