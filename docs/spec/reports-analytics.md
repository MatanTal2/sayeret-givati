# Reports & Analytics tab — Specification

> **Status:** Planning. No code yet. Owner: pending.
> **Related:** `docs/codebase/src/hooks/` (existing aggregating hooks), `docs/spec/equipment-flow.md`, `docs/spec/ammunition-feature.md`, `docs/spec/soldier-qualifications.md`.

---

## 1. Context

`/management` already exposes 15 tabs (`src/hooks/useManagementTabs.ts:42-149`). None of them surface **cross-domain analytics**. Today, a commander who wants "how many broken weapons in the unit", "how much ammo did team X go through last week", or "which categories does every soldier sign for" has to scan three separate pages and count by eye. This spec adds a new management tab — **דוחות ונתונים** (Reports & Analytics) — that consolidates those questions into one place.

The page is read-only. It executes a fixed set of named "reports" against existing collections (`equipment`, `ammunition*`, `actionsLog`, `users`, `authorized_personnel`, `soldierStatus`) and renders each result as a table + optional chart, with a single global date-range filter and a single team filter.

We are NOT building a generic query builder. We are building a fixed list of curated reports that the unit actually needs.

---

## 2. Goals

1. **Single landing page** for unit-wide analytics — no jumping between tabs.
2. **Mirror existing data shapes** — no new collections, no duplicate-as-aggregate writes. Reports derive from existing reads.
3. **Permission-gated** — only roles with `canViewAnalytics` (new helper, defaults to TEAM_LEADER+ for own team, ADMIN/SYSTEM_MANAGER for all teams).
4. **Cheap to load** — reuse `onSnapshot`-cached hooks (`useEquipment`, `useAmmunitionInventory`, etc.) where the data is already in memory. Only `actionsLog` requires a fresh fetch per report run (those queries are date-bounded so cost stays bounded).
5. **Exportable** — every table has a "הורד CSV" button. PDF export deferred.

Non-goals (deliberately out of scope):
- Real-time dashboards with auto-refresh.
- Multi-unit / multi-tenant analytics.
- Custom dashboards or saved views.
- Trend forecasting / ML.

---

## 3. Open product questions

These block code start. Answer before Phase 2.

1. **Date range default** — "last 30 days" or "last 7 days" or "since round opened"? Round-open date is in `systemConfig` (`roundOpen` toggle from PR #76 / equipment-exchange-and-storage spec) but the toggle has no historical timestamp wired yet — would need a new field.
2. **Team scope** — Does TEAM_LEADER see their own team only (matching `useEquipment({ scope: 'team' })` constraint), or can they see all teams in read-only mode? Suggested: own team only by default, with an explicit "compare to unit average" toggle that anonymizes other teams.
3. **Which reports are MVP?** The plan below proposes 9 reports across 4 categories. Which subset ships first? Suggested MVP: A1, A2, B1, B2, D1 (highest-frequency commander questions).
4. **Charts vs tables-only for v1?** Tables alone are cheap; adding a chart library is a one-time decision (see Phase 8).
5. **Drill-down** — clicking a row should… open `/equipment?filter=...` with the filter pre-applied? Open a side panel? Do nothing for v1?
6. **PDF export** — required for v1 or deferred? Hebrew RTL PDF generation is non-trivial.
7. **Schedule** — automated weekly digest emailed to commanders? Out of scope for this spec but flag it if planned.
8. **Audit** — should every report run write an `actionsLog` entry (`REPORT_VIEWED` / `REPORT_EXPORTED`)? Useful for "who looked at the ammo report and when" but adds write cost. Default to **export only writes audit, view does not**.

---

## 4. Report catalogue

Each report has: a fixed query, a primary metric, a row schema, and an optional chart. Grouped by category.

### A. Equipment inventory

**A1. ציוד לפי סטטוס** — Equipment by status
- Query: `equipment` collection, filter visibility by role.
- Group by `EquipmentStatus`. Output: row per status with count.
- Filters: team (if any), category (optional).
- Chart: horizontal bar.
- Source: client-side aggregation over `useEquipment({ scope })`.

**A2. ציוד פגום** — Broken equipment
- Query: `equipment` where `condition !== GOOD` OR `status === REPAIR` OR `status === LOST`.
- Output: row per item: serial, productName, currentHolder, condition, status, lastReportDate.
- Chart: bar by condition.
- Source: `useEquipment` + last-report-date pulled from `actionsLog` (one batched fetch keyed on the visible item ids, filtered to `REPORT_SUBMITTED`).

**A3. ציוד מאוחסן / הוחזר לצה"ל** — Storage + retired
- Query: `equipment` where `status === STORED` OR `status === RETIRED`.
- Output: row per item with `storedAt` / `retiredAt` from `actionsLog`.
- Chart: stacked bar by team.
- Source: `archivedEquipment` from `useEquipment` (already partitioned by bug #25) + STORED filter on the active bucket.

**A4. ציוד שהוחלף** — Exchanged equipment count + chain history
- Query: `equipment` where `predecessorDocId` is set OR `successorDocId` is set.
- Output: pairs `{ old, new, reason, exchangedAt }` from `actionsLog` (`EXCHANGE_COMPLETED`).
- Chart: line over time (exchanges per week).
- Source: `actionsLog.where('actionType', '==', EXCHANGE_COMPLETED)` over the selected date range.

### B. Sign-on coverage (per category)

**B1. כיסוי קטגוריות** — Coverage matrix
- Goal: "which equipment categories does every soldier sign for".
- For each `equipmentType.category` × each soldier in roster, compute `hasItem: boolean` based on `equipment.currentHolderId === soldier.uid && equipment.category === categoryId`.
- Output: roster × category matrix, ✓ / ✗.
- Filters: team.
- Chart: heatmap (optional v2).
- Source: cross-join of `useEquipment({ scope: 'team' })` + `useUsersAndPersonnel` (roster hook from bug #21 fix). Pure client compute.

**B2. פערי חתימה** — Missing signatures
- Goal: per category that requires daily-check, which soldiers DON'T have one signed out.
- Query: equipmentTypes where `requiresDailyStatusCheck === true`, then roster, then `equipment` matched by holder.
- Output: row per (soldier × category) with no holding.
- Source: B1 matrix filtered to gaps.

### C. Ammunition

**C1. שימוש בתחמושת** — Ammunition usage over time
- Query: `ammunitionReports` collection over selected date range.
- Group by week × ammo type × team.
- Output: pivot table, rows = ammo type, cols = weeks, cells = quantity reported as used.
- Chart: line per ammo type.
- Source: existing `useAmmunitionReports` hook (already filters by team-scope in role gate).
- **Open question:** "used" semantics — is the report quantity the consumption delta or absolute count? Confirm against `docs/spec/ammunition-feature.md` before coding.

**C2. מלאי תחמושת נוכחי** — Current inventory snapshot
- Query: `ammunitionStock` + `ammunitionItems` for the scoped team / unit.
- Output: row per ammo type × holder with `bruceCount`, `openBruceState`, `quantity`.
- Source: `useAmmunitionInventory({ holderType: TEAM, holderId })`.

**C3. תחמושת לפי מחזיק** — Distribution per holder
- Group `ammunitionStock` by `holderType` (USER / TEAM / UNIT) and `holderId`.
- Chart: stacked bar.

### D. People / status

**D1. סטטוס יומי של היחידה** — Daily status snapshot
- Query: `soldierStatus` joined with `users` ∪ `authorized_personnel` (existing read-time roster join).
- Group by `status` (בית / משמר / אחר + custom statuses).
- Output: counts per status, and a drill-down list per status.
- Chart: pie / donut.
- Source: existing roster hook + `useSoldierStatus`.
- Already partially shipped on `/status` (bug #7 status-page registered dot, PR #57). This report just re-aggregates the same data for analytics view.

---

## 5. Architecture

### 5.1 Tab plumbing (Phase 1)

- Add an entry to `ALL_MANAGEMENT_TABS` in `src/hooks/useManagementTabs.ts:42-149`:
  ```ts
  {
    id: 'reports-analytics',
    label: TEXT_CONSTANTS.MANAGEMENT.TABS.REPORTS_ANALYTICS,
    description: TEXT_CONSTANTS.MANAGEMENT.TAB_DESCRIPTIONS.REPORTS_ANALYTICS,
    icon: BarChart3, // lucide
    category: 'system',
    requiresAnalyticsPermission: true,
  }
  ```
- Add a permission helper `canViewAnalytics(user)` next to the existing `canManageSystem`/`canViewAuditLogs` checks (`src/hooks/useManagementTabs.ts:158-202`). Default: TEAM_LEADER+ for own team, ADMIN/SYSTEM_MANAGER for cross-team.
- Wire the new component in `src/components/management/tabs/TabContentRenderer.tsx:29-80` switch.
- New tab component: `src/components/management/tabs/ReportsAnalyticsTab.tsx`.
- Bilingual text:
  - Hebrew in `src/constants/text.ts` under `MANAGEMENT.TABS.REPORTS_ANALYTICS` + `MANAGEMENT.TAB_DESCRIPTIONS.REPORTS_ANALYTICS`.
  - New section `TEXT_CONSTANTS.FEATURES.REPORTS_ANALYTICS` for report titles, column headers, button labels.
  - English mirror in `src/constants/text.en.ts`.

### 5.2 Data layer (Phase 2)

Two flavours of compute:

**Reuse existing live hooks** for any aggregation that fits in memory:
- `useEquipment({ scope })` — A1, A2, A3, B1, B2.
- `useAmmunitionInventory({ holderType, holderId })` — C2, C3.
- `useUsersAndPersonnel` / `useSoldierStatus` — D1.

Add pure-function aggregators in `src/lib/analytics/`:
- `src/lib/analytics/equipmentAggregates.ts` — `countByStatus(list)`, `countByCondition(list)`, `categoryCoverage(equipmentList, roster)`, `missingSignatures(...)`.
- `src/lib/analytics/ammunitionAggregates.ts` — `usageByWeek(reports)`, `inventoryByHolder(stock)`.
- `src/lib/analytics/statusAggregates.ts` — `statusCounts(soldiers)`.

These are pure functions: input list → typed result. Unit-testable without mocks.

**One-shot fetches for date-bounded queries** (A4, C1):
- `src/lib/analytics/actionsLogQueries.ts` — `getActionsByTypeInRange(actionType, from, to, scopeFilter)`. Use server actions (`firebase-admin`) since these can be cross-user and might exceed client read-rule allowances.

Each report is its own small subcomponent (`<ReportCardA1 />`, `<ReportCardA2 />`, …) inside `ReportsAnalyticsTab.tsx`, with shared `<ReportShell title onExport onRefresh>` wrapper. Don't build a generic Report component — each report's row schema is different and the abstraction would leak.

### 5.3 Filters (Phase 3)

Top-of-page filter bar (shared across all reports):
- **Date range** — preset chips (today / 7d / 30d / since round opened) + custom range. State stored in URL search params so the tab is shareable / refresh-stable.
- **Team** — `Select` sourced from `systemConfig.teams` (same pattern as `WizardStepDetails:78` / fix from this session's `ReportRequestTab` `Select` upgrade). For TEAM_LEADER, the dropdown is locked to their own team.
- **Refresh** — button that re-fires the date-bounded queries (A4, C1, anything from `actionsLog`).

### 5.4 Export (Phase 5)

Per-report "הורד CSV" button. Reuse existing CSV utilities if any (`src/lib/__tests__/ammunitionCsvExport.test.ts` suggests `ammunitionCsvExport.ts` exists — check at code-start). Write `src/lib/analytics/csvExport.ts` with a typed `exportToCsv<T>(rows, columns, filename)` helper.

PDF deferred — flag in `project_future_features.md`.

---

## 6. Phases

| # | Phase | Output | Blocked by |
|---|-------|--------|-----------|
| 1 | Tab plumbing | Empty `ReportsAnalyticsTab` reachable at `/management?tab=reports-analytics`. Permission gate wired. Bilingual text scaffolded. | Open Q3 (which reports MVP) |
| 2 | Data layer | `src/lib/analytics/*` aggregators + tests. No UI yet. | Phase 1 |
| 3 | Filter bar | Date-range + team + URL state | Phase 1 |
| 4 | Report cards — equipment | A1, A2, A3 — tables only (no charts yet) | Phase 2-3 |
| 5 | Report cards — ammo & people | C1, C2, D1 | Phase 4 |
| 6 | Sign-on coverage | B1, B2 (cross-join logic; more nuanced) | Phase 5 |
| 7 | Exchange/replacement | A4 — needs `actionsLog` server query | Phase 6 |
| 8 | Charts | Pick a lib (see §7), wire the chart slot on each report card | Phase 7 |
| 9 | CSV export | `csvExport.ts` + per-card button | Phase 8 (or earlier — can ship per report) |
| 10 | Docs | `docs/codebase/src/components/management/tabs/ReportsAnalyticsTab.md` + this spec updated | Throughout |

Estimated effort: 4-6 sessions if all 9 reports land. MVP (A1, A2, B1, B2, D1) is 2-3 sessions.

---

## 7. Charts library — decision needed

`package.json` has no chart library today (Explore agent confirmed). Candidates:

| Lib | Pros | Cons | Bundle |
|-----|------|------|--------|
| **Recharts** | React-native, declarative, mature, RTL support (with manual `dir`). | ~90kb gzip, no heatmap out of the box. | ~90kb |
| **Visx** (Airbnb) | Composable primitives, smallest bundle for what you use. | More boilerplate, steeper learning curve. | ~30kb (tree-shaken) |
| **Chart.js + react-chartjs-2** | Familiar API, lots of chart types. | Imperative under the hood, larger bundle. | ~60kb |
| **None — pure CSS bars / Tailwind** | Zero deps, deterministic. | No line/area charts; limited polish. | 0 |

Recommendation: defer to Phase 8 and ship tables in Phases 4-7. If charts are added, **Recharts** is the lowest-friction choice for the bar/line/pie set this spec needs.

---

## 8. Critical files (planned)

- `src/components/management/tabs/ReportsAnalyticsTab.tsx` — NEW, top-level tab component.
- `src/components/management/tabs/reportsAnalytics/` — directory for per-report card subcomponents.
- `src/lib/analytics/equipmentAggregates.ts` — NEW, pure aggregators.
- `src/lib/analytics/ammunitionAggregates.ts` — NEW.
- `src/lib/analytics/statusAggregates.ts` — NEW.
- `src/lib/analytics/actionsLogQueries.ts` — NEW, date-bounded fetches.
- `src/lib/analytics/csvExport.ts` — NEW.
- `src/lib/__tests__/analytics/*.test.ts` — NEW, one file per aggregator module.
- `src/hooks/useManagementTabs.ts` — registry update.
- `src/components/management/tabs/TabContentRenderer.tsx` — switch case.
- `src/constants/text.ts` + `src/constants/text.en.ts` — Hebrew + English strings.
- `docs/codebase/src/components/management/tabs/ReportsAnalyticsTab.md` — NEW.

---

## 9. Verification

1. `npm run lint` clean, `npx tsc --noEmit` clean.
2. Unit tests for every aggregator in `src/lib/analytics/*` — pure functions, no mocks needed.
3. Manual QA matrix per role:
   - SOLDIER: tab invisible.
   - TEAM_LEADER: tab visible, team filter locked to own team, sees data for own team only.
   - MANAGER / ADMIN: tab visible, team filter unlocked, sees all teams.
4. Date range URL state: copy the URL, paste in new tab, same filters apply.
5. CSV export: open in Excel + Google Sheets, verify Hebrew encoding (BOM prefix on UTF-8) and column alignment.
6. RTL: every report card uses logical Tailwind (`ps-`/`pe-`/`ms-`/`me-`/`text-start`/`text-end`).
7. Cost spot-check: open the tab once, watch the Firebase console; confirm the `onSnapshot` listeners we reuse are already-attached and the only NEW reads are the `actionsLog` date-bounded fetches.

---

## 10. Sequencing

Recommend a single feature branch `feat/reports-analytics`. Phase 1-3 in session 1 (plumbing + filter bar). Phases 4-5 in session 2 (MVP report cards). Subsequent phases per user demand — don't ship phases without a real consumer for that report.

PR boundary: each phase can ship as its own PR if user prefers smaller reviews (per `feedback_branch_merge`). Default plan: one PR per session, 2-3 phases bundled.
