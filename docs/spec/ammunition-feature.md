# Ammunition Reporting Feature

## SESSION CHECKPOINT

- **Branch:** `feat/ammunition-reporting` (off `fixBugs20.4.26`).
- **Phase 0 status:** COMPLETE. Foundation merged into the branch — `src/types/ammunition.ts`, `src/lib/db/collections.ts` (+6 constants), `src/types/notifications.ts` (+2 enum values), `src/constants/text.ts` (`FEATURES.AMMUNITION` block), plus docs (`docs/codebase/src/types/ammunition.md`, `docs/codebase/src/types/notifications.md`, `docs/firebase-operations.md`). `npm run lint` + `npm run build` clean.
- **Phase 1 status:** COMPLETE. `src/lib/db/server/systemConfigService.ts` (`serverGetSystemConfig`, `serverUpdateSystemConfig`, `validateSystemConfigPayload`), `src/app/api/system-config/route.ts` (GET + admin-gated PUT), `src/hooks/useSystemConfig.ts`. `SystemConfigTab.tsx` rewritten — old placeholder fields removed; only the ammunition recipient picker remains, hydrated via `getUserProfile`. Test: `src/lib/__tests__/systemConfigService.test.ts` — 7 passing. Docs added/updated. `lint` + `build` clean.
- **Phase 2 status:** COMPLETE. `src/lib/ammunition/subcategories.ts` (fixed 6-item taxonomy), `src/data/ammunitionTemplates.ts` (16 canonical seeds), `src/lib/db/server/ammunitionTemplatesService.ts` (CRUD + idempotent `serverSeedCanonicalAmmunitionTemplates`), `src/lib/ammunition/templatesService.ts` (client read), `/api/ammunition-templates` root + `[id]`, `src/hooks/useAmmunitionTemplates.ts`, `src/components/ammunition/AmmunitionTemplateForm.tsx`, `src/components/management/tabs/AmmunitionTab.tsx` + `ammunition/AmmunitionTemplatesSection.tsx` (real) + `AmmunitionInventorySection`, `AmmunitionReportsSection`, `AmmunitionRequestsSection` (placeholders), wired through `useManagementTabs` (`canManageTemplates || isTeamLeader`) + `TabContentRenderer`. Text constants extended (`MANAGEMENT.TABS.AMMUNITION` + description). Test: `src/lib/__tests__/ammunitionTemplatesService.test.ts` — 11 passing. `lint` + `build` clean. Pre-existing registration & `adminUtils` test failures untouched.
- **Phase 3 status:** COMPLETE. `src/lib/db/server/ammunitionInventoryService.ts` (BRUCE/LOOSE_COUNT upsert + SERIAL CRUD + `canMutateAmmunitionInventory` permission gate that consults `systemConfig/main` for the responsible-manager override and `users/{uid}` for TL→holder team-resolution; "actor's own writes only" enforced for USER/TL via `createdBy`). Client read facade, `useAmmunitionInventory` hook with `{ stock, items, upsertStock, deleteStock, createSerialItem, updateSerialItem, deleteSerialItem, refresh }`. `/api/ammunition-inventory` root + `[id]` with kind=`stock`/`item` switch. Components: `AmmunitionInventoryView` (shared list, BRUCE/LOOSE_COUNT/SERIAL formatters, optional `canMutate` + delete buttons + holder labels) and `AddInventoryModal` (template-driven fields, holder picker for TL+). Replaced placeholder management `AmmunitionInventorySection.tsx` with full CRUD UI. New page `/ammunition` (own + team sections). New `PersonalAmmunitionSection` mounted on `/equipment` between BulkActionBar and modals — filters to USER-allocated holdings of the current user, hidden when empty. Home-page nav routes via `getFeatureRoutes` — added an `available` ammunition card. Test: `src/lib/__tests__/ammunitionInventoryService.test.ts` — 15 passing. `lint` clean; clean `npm run build` succeeds (delete `.next` first; routes for `/api/ammunition-{templates,inventory}/[id]` show in build output). Pre-existing test failures untouched.
- **Resume at:** **Phase 4 — Self-report + notifications**. `serverSubmitAmmunitionReport` runs in a single transaction: write `ammunitionReports` doc, decrement `ammunitionInventory` (BRUCE) or flip `ammunition` items to CONSUMED (SERIAL), write `actionsLog` entry, query reporter's TL(s) by `teamId+userType==TEAM_LEADER`, read `systemConfig/main.ammoNotificationRecipientUserId`, batch-create notifications (excluding the reporter, deduped). Client: `src/lib/ammunition/reportsService.ts`, `useAmmunitionReports`, `/api/ammunition-reports` (POST + GET). UI: `ReportUsageForm` (template picker → BRUCE/LOOSE_COUNT/SERIAL inputs → reason + reporter-picked usedAt). Wire a "report use" CTA into `/ammunition`. Update `src/utils/notifications.ts` template + `NotificationItem` deep-link router for `AMMO_REPORT_SUBMITTED`.

## Context

Sayeret Givati needs visibility into ammunition: what the unit owns, what gets consumed, what's left, and who holds it. Today there is no system — it lives in spreadsheets and verbal reports.

This feature adds:
- A typed inventory model for ammo (templates + stock).
- Self-reporting of usage by any soldier.
- Manager-triggered report requests targeted at a user/team/all.
- Notifications: reporter's TL (FYI) + admin-configured responsible manager (action).
- Manager dashboard with filtered table + CSV export.
- A stub "coming soon" page for training planner (out of scope this round).

The feature reuses heavily from the existing equipment + report-request + notification infrastructure rather than building parallel systems.

## Working model (resolved with user)

- **Tracking modes (3):**
  - **BRUCE** — bullets. Each Bruce (ברוס) holds N קרטג'ים (cardboards, 30 bullets each). Per holder: `bruceCount` + `openBruceState` ∈ {FULL, MORE_THAN_HALF, LESS_THAN_HALF, EMPTY}.
  - **SERIAL** — items with צ (e.g. shoulder-launcher missiles, light mines). One Firestore doc per serial.
  - **LOOSE_COUNT** — countable, no צ (e.g. smoke grenades, launcher grenades, נר עשן). Per holder: integer `quantity`.
- **Hierarchy inside ammo:** `subcategory > type`. No top-level "category" picker on the ammo page — the collection itself is the category. Subcategories are ammo-specific: Bullets, Grenades, Launcher grenades, Shoulder missiles, Mines, Other (נר עשן, מעיל רוח, ...). Types live under subcategory: Bullets→{5.56 white/green/tracer, 7.62 tracer, 0.5 tracer}; Shoulder missiles→{yated, holit, lao, metador}; etc. Equipment categories remain a separate, equipment-only pool — no overlap.
- **Security flag on each template:** `securityLevel: 'EXPLOSIVE' | 'GRABBABLE'` (נפיץ / חמידה). Surfaces as a badge in lists and as a column in audit/dashboard. Does not change tracking logic.
- **Allocation per template:** `USER | TEAM | BOTH`. Examples — bullets/shoulder-launcher/נר עשן → TEAM; launcher grenade → USER; smoke grenade → BOTH; spray grenade → USER.
- **Equipment ↔ Ammunition cross-link:** the equipment page renders an extra "תחמושת אישית" section pulling from `ammunitionInventory` filtered to USER-allocated holdings of the current user. Same UI shell, different data source. No template duplication. The two domains stay independent at the data layer.
- **Inventory CRUD permissions (tiered):**
  - ADMIN + admin-configured responsible manager → any holder, any item.
  - MANAGER (general role) → any user/team.
  - TEAM_LEADER → own team + team members.
  - USER → self only.
  - Update/delete: actor's own writes only; manager+ overrides.
- **Reporters:** any user can self-report.
- **Notifications on submit (both FYI, no workflow):**
  - Reporter's TL(s). Resolved by querying `users` where `teamId == reporter.teamId` AND `userType == TEAM_LEADER`.
  - Admin-configured "responsible ammo manager". Set via System Config tab, persisted in `systemConfig/main`. Single user.
  - Inventory decrement is committed on submit. Reports do not have an approval status. Manager uses dashboard for browse/export.
- **Management page surface:** one "Ammunition" tab containing 4 inner subsections — *Templates / Inventory / Reports / Requests*. Inner subsections rendered as a sub-tab strip inside the main tab.
- **Equipment ↔ ammunition bridge:** equipment page renders an extra section ("תחמושת אישית") that reads `ammunitionInventory` filtered to USER-allocated holdings of the current user. No entry in equipment's category dropdown. Equipment template categories stay equipment-only.
- **Privileged role:** none added — every user can self-report.
- **Training planner:** stub `/ammunition/training` page only.
- **Dashboard v1:** filter table + CSV export. No chart library.

## Data Model (target shape)

### Collections (new)

| Collection | Purpose |
|---|---|
| `ammunitionTemplates` | Type definitions (e.g. "5.56 white", "smoke grenade"). Admin-managed. |
| `ammunition` | SERIAL-mode items only (one doc per serial / צ). Mirrors `equipment`. |
| `ammunitionInventory` | BRUCE-mode stock per holder (one doc per template+holder). |
| `ammunitionReports` | Submitted usage reports. |
| `ammunitionReportRequests` | Manager-triggered requests. Mirrors existing `reportRequests`. |
| `systemConfig` | Single-doc (`main`) for system-wide settings. New field: `ammoNotificationRecipientUserId`. |

### Key types (in `src/types/ammunition.ts`)

```ts
type AmmunitionAllocation = 'USER' | 'TEAM' | 'BOTH';
type TrackingMode = 'BRUCE' | 'SERIAL' | 'LOOSE_COUNT';
type BruceState = 'FULL' | 'MORE_THAN_HALF' | 'LESS_THAN_HALF' | 'EMPTY';
type SecurityLevel = 'EXPLOSIVE' | 'GRABBABLE';   // נפיץ / חמידה

interface AmmunitionType {
  id: string;
  name: string;                 // Hebrew, e.g. "5.56 לבן"
  description?: string;
  subcategory: string;          // "Bullets" | "Grenades" | "Launcher grenades" | "Shoulder missiles" | "Mines" | "Other"
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  // BRUCE mode only:
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
  totalBulletsPerBruce?: number;
  status: 'CANONICAL' | 'PROPOSED' | 'PENDING_REQUEST';
  createdAt: Timestamp; updatedAt: Timestamp; createdBy: string;
}

// BRUCE or LOOSE_COUNT stock per holder (one doc per template+holder)
interface AmmunitionStock {
  id: string;
  templateId: string;
  trackingMode: 'BRUCE' | 'LOOSE_COUNT';
  holderType: 'USER' | 'TEAM';
  holderId: string;
  // BRUCE mode:
  bruceCount?: number;
  openBruceState?: BruceState;
  // LOOSE_COUNT mode:
  quantity?: number;
  updatedAt: Timestamp;
}

// SERIAL-mode item (one per serial / צ)
interface AmmunitionItem {
  id: string;                   // = serial number (צ)
  templateId: string;
  currentHolderType: 'USER' | 'TEAM';
  currentHolderId: string;
  status: 'AVAILABLE' | 'CONSUMED' | 'LOST' | 'DAMAGED';
  createdAt: Timestamp; updatedAt: Timestamp;
}

interface AmmunitionReport {
  id: string;
  reporterId: string; reporterName: string;
  teamId: string;
  templateId: string; templateName: string;
  trackingMode: TrackingMode;
  // BRUCE mode:
  brucesConsumed?: number;
  cardboardsConsumed?: number;
  bulletsConsumed?: number;
  finalOpenBruceState?: BruceState;
  // SERIAL mode:
  itemSerials?: string[];
  // LOOSE_COUNT mode:
  quantityConsumed?: number;
  reason: string;
  usedAt: Timestamp;            // reporter-picked
  createdAt: Timestamp;         // server
  reportRequestId?: string;     // set if manager-triggered
}

interface AmmunitionReportRequest {
  id: string;
  requestedBy: string; requestedByName: string;
  scope: 'INDIVIDUAL' | 'TEAM' | 'ALL';
  targetUserIds: string[];
  templateIds?: string[];
  dueAt?: Timestamp;
  fulfillmentByUser: Record<string, { fulfilled: boolean; fulfilledAt?: Timestamp; reportId?: string }>;
  createdAt: Timestamp;
  status: 'OPEN' | 'CLOSED' | 'CANCELED';
}
```

## Reuse (existing in codebase)

- `CategoriesService` + `FormFieldCategory` / `FormFieldSubcategory` — `src/lib/categories/`, `src/components/equipment/template-form/`.
- Template-management tab shape — `src/components/management/tabs/TemplatesTab.tsx`.
- Notification creation — `NotificationService.createNotification()` at `src/utils/notifications.ts:35-69`.
- Manager-triggered report request flow — `src/lib/db/server/reportRequestService.ts` (mirror exactly).
- Audit/report table pattern — `src/components/management/tabs/AuditLogsTab.tsx` (date-range filter + sortable table).
- Audit trail — write to existing `actionsLog` (`src/lib/db/server/actionsLogService.ts`) for every report.
- Permission gating — `useManagementAccess()` (`src/hooks/useManagementAccess.ts`).
- User → TL resolution — `users.teamId` (`src/types/user.ts:59,90`) + `users.userType == TEAM_LEADER` query.
- Server transactional pattern — `serverCreateEquipment()` at `src/lib/db/server/equipmentService.ts:25-50`.

## TL + Manager notification logic (server-side, on report submit)

1. Read reporter's `teamId` from `users/{reporterId}`.
2. Query `users` where `teamId == reporter.teamId` AND `userType == TEAM_LEADER`. Exclude reporter if reporter is the TL.
3. Read `systemConfig/main.ammoNotificationRecipientUserId`.
4. Build target list = TL UIDs ∪ {recipient}; dedupe; remove the reporter.
5. Batch-create `AMMO_REPORT_SUBMITTED` notifications with deep link to the report.
6. All inside one transaction with the report write + inventory decrement + actionsLog entry.

---

# Phased Build Plan

Each phase is self-contained: ships independently, builds + lints + tests cleanly on its own, and leaves the codebase in a working state. Context can be cleared between phases. Each phase ends with a doc update covering its files.

Order matters where noted. A phase's "depends on" lists prior phases that must be merged first.

## Phase 0 — Foundation (types, constants, text, collection IDs)

**Goal:** Establish the contract. No UI, no behavior change. Just shapes.

**Files:**
- Create `src/types/ammunition.ts` (all interfaces above).
- Modify `src/lib/db/collections.ts` — add `AMMUNITION_TEMPLATES`, `AMMUNITION`, `AMMUNITION_INVENTORY`, `AMMUNITION_REPORTS`, `AMMUNITION_REPORT_REQUESTS`, `SYSTEM_CONFIG`.
- Modify `src/constants/text.ts` — add `AMMUNITION` Hebrew block (titles, labels, errors, button text).
- Modify `src/types/notifications.ts` — add `AMMO_REPORT_SUBMITTED`, `AMMO_REPORT_REQUESTED` to `NotificationType`.

**Verify:** `npm run lint`, `npm run build` clean. No new tests yet — nothing to test.
**Docs:** `docs/codebase/src/types/ammunition.md`. Update `docs/firebase-operations.md` collection table.
**Depends on:** —

---

## Phase 1 — System Config persistence (responsible manager picker)

**Goal:** Make the existing System Config tab actually save. Adds the field that Phase 4 needs but is independently useful.

**Files:**
- Create `src/lib/db/server/systemConfigService.ts` — read/write `systemConfig/main`.
- Create `src/app/api/system-config/route.ts` — GET + PUT (admin only).
- Create `src/hooks/useSystemConfig.ts` — `{ config, isLoading, error, save }` shape.
- Modify `src/components/management/tabs/SystemConfigTab.tsx` — replace placeholder with real form. Add `ammoNotificationRecipientUserId` field using a UserPicker (search users by name).

**Verify:** Admin opens System Config, picks a user, saves, refreshes — value persists. Non-admin can't write (rule check). Add Jest test for the service.
**Docs:** `docs/codebase/src/lib/db/server/systemConfigService.md`, `docs/codebase/src/hooks/useSystemConfig.md`. Update SystemConfigTab.md.
**Depends on:** Phase 0.

---

## Phase 2 — Ammunition Templates CRUD + Management tab shell

**Goal:** Admin can create/update/delete templates. The "Ammunition" management tab is in place with the Templates subsection rendered. Other subsections render placeholder skeletons until later phases fill them.

**Files:**
- Create `src/data/ammunitionTemplates.ts` — seed canonical templates: bullets 5.56 (white/green/tracer), 7.62 (tracer), 0.5 (tracer), נר עשן (LOOSE_COUNT/TEAM/EXPLOSIVE), smoke grenades (LOOSE_COUNT/BOTH/GRABBABLE), spray grenade (LOOSE_COUNT/USER/EXPLOSIVE), launcher grenades (LOOSE_COUNT/USER/EXPLOSIVE — variants smoke/spray/light), shoulder missiles yated/holit/lao/metador (SERIAL/TEAM/EXPLOSIVE), light mine (SERIAL/TEAM/EXPLOSIVE), מעיל רוח (LOOSE_COUNT/TEAM/GRABBABLE).
- Create `src/lib/ammunition/subcategories.ts` — fixed subcategory list (Bullets, Grenades, Launcher grenades, Shoulder missiles, Mines, Other) as a typed enum/const. No Firestore lookup needed for this short list.
- Create `src/lib/db/server/ammunitionTemplatesService.ts` (admin write).
- Create `src/lib/ammunition/templatesService.ts` (client read).
- Create `src/app/api/ammunition-templates/route.ts` + `[id]/route.ts`.
- Create `src/hooks/useAmmunitionTemplates.ts`.
- Create `src/components/ammunition/AmmunitionTemplateForm.tsx` — fields: name, subcategory (from fixed list), allocation, trackingMode, securityLevel, BRUCE constants conditionally, description.
- Create `src/components/management/tabs/AmmunitionTab.tsx` — main container with internal sub-tab strip: *Templates / Inventory / Reports / Requests*. Each inner section is its own component file. In this phase only `AmmunitionTemplatesSection.tsx` is implemented; the other three render a "coming in next phase" placeholder.
- Create `src/components/management/tabs/ammunition/AmmunitionTemplatesSection.tsx` (mirror `TemplatesTab.tsx` shape).
- Create placeholder shells: `AmmunitionInventorySection.tsx`, `AmmunitionReportsSection.tsx`, `AmmunitionRequestsSection.tsx`.
- Modify `src/hooks/useManagementTabs.ts` — register single `AmmunitionTab`.
- Modify `src/components/management/tabs/TabContentRenderer.tsx` — switch case.

**Verify:** Admin creates "5.56 white" (BRUCE/TEAM/EXPLOSIVE/30/33). Edits it. Deletes a draft. Subcategory dropdown shows only the 6 ammo subs. Service tests cover create/update/delete + validation.
**Docs:** Mirror new files under `docs/codebase/src/components/ammunition/`, `docs/codebase/src/components/management/tabs/ammunition/`, `docs/codebase/src/lib/ammunition/`, etc.
**Depends on:** Phase 0.

---

## Phase 3 — Inventory CRUD (tiered permissions) + read views

**Goal:** Inventory can be added/edited/deleted by the right actors; users see their own + team stock; equipment page surfaces personal ammo.

**Permissions enforced server-side:**
- ADMIN + responsible-manager → any holder.
- MANAGER → any user/team.
- TEAM_LEADER → own team + members.
- USER → self only (USER-allocated templates only).
- Update/delete: actor's own writes only; manager+ overrides.

**Files:**
- Create `src/lib/db/server/ammunitionInventoryService.ts` — upsert `ammunitionInventory` (BRUCE/LOOSE_COUNT) doc; create/update/delete `ammunition` (SERIAL) item. Permission checks per call.
- Create `src/lib/ammunition/inventoryService.ts` (client read).
- Create `src/hooks/useAmmunitionInventory.ts`.
- Create `src/app/api/ammunition-inventory/route.ts` + `[id]/route.ts`.
- Replace placeholder `AmmunitionInventorySection.tsx` (under management) with full CRUD UI: pick template → pick holder (user/team) → enter bruceCount/quantity/serials → submit. Edit + delete rows.
- Create `src/components/ammunition/AmmunitionInventoryView.tsx` — used in both `/ammunition` page and management section. Lists inventory grouped by template; BRUCE shows count+state, LOOSE_COUNT shows quantity, SERIAL shows item list.
- Create `src/components/ammunition/AddInventoryModal.tsx` — used by `/ammunition` page for self-add (USER scope) and TL team-add. Wires into the same API route as the management section.
- Create `src/app/ammunition/page.tsx` — main user-facing page (own inventory + team inventory). "+ הוסף" button visible per-permissions. No "report" CTA yet.
- Modify `src/app/equipment/page.tsx` — add a "תחמושת אישית" section component that renders `AmmunitionInventoryView` filtered to USER-allocated holdings of `currentUser.uid`. Section hidden if list empty.
- Modify `src/app/page.tsx` — add תחמושת card.

**Verify:** TL adds 2 Bruces to their team; user in team A loads `/ammunition` and sees them; non-team user does not. User adds a personal launcher grenade; appears on `/ammunition` AND on `/equipment` "תחמושת אישית" section. Admin edits/deletes someone else's row; TL cannot edit another team's row (server rejects). Service tests cover the permission matrix.
**Docs:** `docs/codebase/src/app/ammunition/page.md`, equipment page section addition, inventory service + view + hook + modal.
**Depends on:** Phase 2.

---

## Phase 4 — Self-report + notifications (core flow)

**Goal:** User submits a usage report. Inventory decrements. TL + responsible manager get a notification. Audit log entry written. All atomic.

**Files:**
- Create `src/lib/db/server/ammunitionReportsService.ts` — single transaction:
  1. write `ammunitionReports` doc
  2. decrement `ammunitionInventory` (BRUCE) or update `ammunition` items to CONSUMED (SERIAL)
  3. write `actionsLog` entry
  4. resolve TL UIDs via team query + read `systemConfig/main.ammoNotificationRecipientUserId`
  5. batch-create notifications
- Create `src/lib/ammunition/reportsService.ts` (client read).
- Create `src/app/api/ammunition-reports/route.ts` (POST + GET).
- Create `src/hooks/useAmmunitionReports.ts`.
- Create `src/components/ammunition/ReportUsageForm.tsx` — pick template → BRUCE inputs (bruces consumed, cardboards consumed, final open state) OR LOOSE_COUNT input (quantity consumed) OR SERIAL inputs (multiselect serials) → reason → date+time picker.
- Modify `src/app/ammunition/page.tsx` — add "report use" CTA + modal hosting the form.
- Modify `src/utils/notifications.ts` — add `ammoReportSubmitted()` template.
- Modify `src/components/notifications/NotificationItem.tsx` — route `AMMO_REPORT_SUBMITTED` to `/management?tab=ammunition&section=reports&reportId=...`.

**Verify:** User submits report. Stock decrements correctly. TL gets notif. Configured manager gets notif. Reporter does not get one. `actionsLog` has entry. All in one transaction (kill mid-flight in test, no partial state).
**Tests:** Mock Firestore admin; assert all 5 writes happen in a single batch; assert dedupe; assert reporter exclusion.
**Docs:** Mirror new files.
**Depends on:** Phase 1, Phase 2, Phase 3.

---

## Phase 5 — Manager dashboard subsection (filter + CSV)

**Goal:** Replace the placeholder `AmmunitionReportsSection.tsx` with the real Reports subsection inside the existing single "Ammunition" management tab.

**Files:**
- Implement `src/components/management/tabs/ammunition/AmmunitionReportsSection.tsx` — date range + subcategory + template + team + reporter filters. Sortable table (mirror `AuditLogsTab.tsx`). Columns: timestamp, reporter, team, template (with security-level badge), consumed (formatted per tracking mode), reason. "Export CSV" button.
- Create `src/lib/ammunition/csvExport.ts` — Hebrew columns, BOM-prefixed UTF-8 for Excel.
- No new tabs to register — `AmmunitionTab` already exists from Phase 2.

**Verify:** Manager opens Ammunition tab → Reports subsection. Filters by date + team. Exports CSV. CSV opens in Excel with Hebrew intact. Test: serializer round-trip.
**Docs:** Mirror new file.
**Depends on:** Phase 4.

---

## Phase 6 — Manager-triggered report requests

**Goal:** Manager creates a "please report" request scoped to a user/team/all. Targets get a notification. Submitting a report fulfills the request.

**Files:**
- Create `src/lib/db/server/ammunitionReportRequestService.ts` — mirror `reportRequestService.ts` exactly. Send `AMMO_REPORT_REQUESTED` notif batch.
- Create `src/app/api/ammunition-report-requests/route.ts` (POST + PATCH cancel).
- Create `src/hooks/useAmmunitionReportRequests.ts`.
- Implement `src/components/management/tabs/ammunition/AmmunitionRequestsSection.tsx` — list open/closed requests, "+ create request" button (modal: scope picker + optional template list + due date), per-request fulfillment progress.
- Modify `ReportUsageForm.tsx` — if launched from a notification deep link with `requestId`, pre-fill template list and pass `reportRequestId` through to the report.
- Modify `ammunitionReportsService.ts` — when `reportRequestId` is set, also patch `fulfillmentByUser[reporterId]` in the same transaction.
- Modify `src/utils/notifications.ts` — add `ammoReportRequested()` template.
- Modify `src/components/notifications/NotificationItem.tsx` — route `AMMO_REPORT_REQUESTED` to `/ammunition?requestId=...`.

**Verify:** Manager triggers request to team A. All team-A users get notif. One submits → request shows fulfilled for that user, still open for others.
**Docs:** Mirror new files.
**Depends on:** Phase 4.

---

## Phase 7 — Training planner stub

**Goal:** Reserve the URL + nav slot. Placeholder content only.

**Files:**
- Create `src/app/ammunition/training/page.tsx` — "בקרוב" page with brief description.
- Modify `src/app/ammunition/page.tsx` — add nav link to `/ammunition/training`.

**Verify:** Page renders. Lint/build clean.
**Docs:** `docs/codebase/src/app/ammunition/training/page.md` + a one-paragraph future-spec note in `docs/spec/ammunition-feature.md`.
**Depends on:** Phase 3 (only because it adds a link from the inventory page).

---

## Phase 8 — Firestore rules + final docs sweep

**Goal:** Lock down access. Sync all docs.

**Files:**
- Modify `firebase/firestore.rules` — add rules for all 6 new collections + `systemConfig/main`. Read scoping by team for inventory; manager-only writes for templates; user-only writes for own reports.
- Update `docs/firebase-operations.md` — fully list new ops.
- Update `docs/duplications.md` — note any patterns now duplicated across equipment + ammunition.
- Refresh `docs/spec/ammunition-feature.md` (this file → committed copy) with any drift from implementation.

**Verify:** Run rules unit tests (or manual: open as non-team user, confirm denied). Final `npm run lint` + `npm run build` + `npm test`.
**Docs:** This phase IS docs.
**Depends on:** All prior phases merged.

---

## Out of Scope

- Training planner functionality (stub only).
- Charts in dashboard.
- Multi-bruce open state per holder (assume one open Bruce per template per holder).
- Mobile-specific layouts beyond existing responsive patterns.
- Per-item transfer history for SERIAL ammo (can add later by mirroring equipment's tracking history).
