# Equipment Lifecycle — Specification

> **Status:** Phase 0–8 complete (2026-04-26). This is the canonical spec for the soldier-facing equipment lifecycle. The plan file at `~/.claude/plans/in-the-equipment-route-vivid-crayon.md` is now superseded by this document.
>
> **Related:** `docs/spec/equipment.md` (older, scoped to template + serial-number primitives), `docs/spec/firestore-refactor.md` (read/write architecture).

---

## 1. Goals

A soldier signs up serialized military equipment (צ), records S/N + catalog + photo, can transfer/return/report on it, and the system maintains a full audit trail with role-scoped visibility (self → team → all).

The model is **client-read + admin-write via API routes** (see `docs/spec/firestore-refactor.md`). All equipment-related mutations route through `firebase-admin` server actions.

---

## 2. Role matrix

| Role | View | Add | Report | Transfer (request) | Retire | Force ops | Templates |
|------|------|-----|--------|---------------------|--------|-----------|-----------|
| `user` (soldier) | self + team | yes | self/holder | as holder | as signer only | — | request only |
| `team_leader` | self + team + unit | yes | self/holder, in-team, photo bypass | as holder | as signer only | within team | propose |
| `manager` / `system_manager` | all | yes | anywhere, photo bypass | as holder | as signer only | anywhere | create canonical, approve |
| `admin` | all | yes | anywhere, photo bypass | as holder | as signer only | anywhere | create canonical, approve |

Single source of truth: `src/lib/equipmentPolicy.ts`. UI and server endpoints both consult it.

---

## 3. Data model

### `users/{uid}` — equipment scope fields

```ts
teamId?: string   // team identifier
unitId?: string   // unit identifier (above team)
```

Populated by `WelcomeModal` on first login when missing; editable in `/profile`.

### `equipment/{serialNumber}`

| Field | Notes |
|-------|-------|
| `id` | S/N — also the doc id |
| `equipmentType` | template id |
| `productName`, `category`, `subcategory`, `model`, `manufacturer` | denormalized from template |
| `signedBy` / `signedById` | display name + UID of the legal signer |
| `currentHolder` / `currentHolderId` | display name + UID of the physical holder |
| `holderTeamId`, `holderUnitId`, `signerTeamId`, `signerUnitId` | denormalized from user profiles; **server txn must update both pairs whenever holder/signer changes** |
| `status` | `available` / `security` / `repair` / `lost` / `pending_transfer` / `retired` |
| `condition` | `good` / `needs_repair` / `worn` |
| `photoUrl` | sign-up photo (required at creation) |
| `lastReportPhotoUrl` | most recent report photo |
| `lastReportUpdate` | for staleness badge |
| `batchId` | shared id when items added in one bulk op |
| `catalogNumber` | optional מקט |
| `requiresDailyStatusCheck` | inherited from template |
| `trackingHistory` | append-only on doc |

### `equipmentTemplates/{typeId}`

| Field | Notes |
|-------|-------|
| `name`, `category`, `subcategory`, `description`, `notes` | self-explanatory |
| `requiresSerialNumber` | gates S/N capture in the wizard |
| `requiresDailyStatusCheck` | UI badge |
| `defaultCatalogNumber` | optional |
| `status` | `canonical` / `proposed` / `pending_request` / `rejected` |
| `proposedByUserId`, `proposedAt` | TL or user who proposed/requested |
| `reviewedByUserId`, `reviewedAt` | manager who decided |
| `rejectedReason` | optional rejection note |
| `companionTemplateIds` | future-ready stub (no UI yet) |

Regular users can only pick `status='canonical'` templates.

### Request collections

| Collection | Purpose |
|------------|---------|
| `transferRequests` | user-initiated holder transfers |
| `retirementRequests` | created when signer wants to retire an item they don't currently hold; routed to the holder for approval |
| `reportRequests` | manager-triggered ad-hoc "report now" with per-user fulfillment tracking |
| `equipmentDrafts` | user-owned sign-up drafts parked while a `pending_request` template awaits approval |
| `actionsLog` | audit trail for every mutation (transfers, retirements, reports, force ops, template events) |
| `notifications` | in-app inbox; click handler in `NotificationItem` routes to `/equipment` or `/management` |

---

## 4. End-to-end flows

### 4.1 Sign-up (regular case)

1. Soldier opens `/equipment` → "+ הוסף ציוד" → AddEquipmentWizard.
2. Wizard steps: mode (single / bulk) → category → subcategory → canonical template → per-item S/N + catalog + photo + notes → review.
3. Submit calls `EquipmentService.Items.createEquipmentBatch` → `POST /api/equipment/batch` → `serverCreateEquipmentBatch`. Single mode is a 1-element batch. Bulk mode requires unique S/N + own photo per item.
4. Server txn writes N equipment docs with shared `batchId`, N tracking-history entries, N action logs.

### 4.2 Sign-up — "didn't find the template"

1. Wizard → "didn't find?" link → `RequestNewTemplateFlow` (TemplateForm in `request` mode).
2. Submit calls `proposeTemplate({ ..., draftPayload })` → `POST /api/equipment-templates/propose`. Server creates a `pending_request` template AND an `equipmentDrafts` doc holding the captured S/N + photo + catalog + notes.
3. Manager reviews in `/management` → TemplatesTab → edits + Approve. Server promotes template to `canonical` AND flips matching drafts to `ready_to_submit`. A `template_request_approved` notification fires to the proposer (and any extra users with drafts on the same template).
4. Notification click → `NotificationItem.handleClick` → `/equipment?resumeTemplate=<templateId>`. The page opens the wizard; the wizard resolves the user's matching draft via `getDraftsForUser`, jumps to `details` step pre-filled, and deletes the draft on successful submit.

### 4.3 Report

1. User opens an item → row action "Report" → `ReportModal`.
2. Camera capture (mandatory). TL+ may toggle "bypass photo" (gated by `canReportWithoutPhoto`).
3. Submit uploads via `uploadEquipmentPhoto(blob, equipmentId, 'report')` then calls `EquipmentService.Items.reportEquipment` → `POST /api/equipment/report` → `serverReportEquipment`. Updates `lastReportUpdate`, `lastReportPhotoUrl`, appends tracking entry, writes `DAILY_CHECK_IN` action log.

### 4.4 Transfer

1. Holder opens an item → row action "Transfer" → `TransferModal`. Signer-but-not-holder cannot initiate transfer (use Return instead).
2. Submit calls `createTransferRequest` (server-side via the existing transferRequestService).
3. Recipient receives `equipment_transfer_request` notification → approves on `/equipment` row action. Approval updates `currentHolderId`, denormalized `holderTeamId/UnitId`, and writes action log.

### 4.5 Retirement

1. Only the signer can initiate. Row action "Return" → `ReturnModal`.
2. If signer is also holder: server takes the immediate path (item → `RETIRED`).
3. If signer is not holder: server creates a `retirementRequests` doc for the holder. Holder receives `retirement_request_approval` notification.
4. Server returns `{ kind: 'immediate' | 'request' }` so the modal shows the right success copy.

Audit panel in `RetirementApprovalTab` (manager+) shows pending requests via `getAllPendingRetirementRequests` and recent decided requests via `getRecentDecidedRetirementRequests`.

### 4.6 Force operations (manager / TL)

1. `/management` → ForceOperationsTab.
2. Pick items (filtered to those where `canForceTransfer` is true), kind (holder / signer / both), target user, reason.
3. Submit posts `/api/force-ops` directly (no client facade). Server txn updates `currentHolderId` and/or `signedById` plus the four denormalized team/unit fields from the target user's profile, in one transaction. N action logs (`FORCE_TRANSFER_HOLDER` / `FORCE_TRANSFER_SIGNER`) + `force_transfer_executed` / `force_signer_changed` notifications to displaced parties.
4. Recent-ops panel on the tab queries `actionsLog` for those two action types.

### 4.7 Report request (manager)

1. `/management` → ReportRequestTab.
2. Scope: USER / ITEMS / TEAM / ALL.
   - USER: pick one user via `UserSearchInput`. Client passes `targetUserIds: [user.uid]`.
   - ITEMS: paste S/Ns CSV. Holder UIDs derived from local equipment list and passed as `targetUserIds`; S/Ns also passed as `targetEquipmentDocIds`.
   - TEAM: client passes empty `targetUserIds` + `targetTeamId`. Server materializes from `users where teamId == targetTeamId AND status == 'active'`.
   - ALL: client passes empty `targetUserIds`. Server materializes from `users where status == 'active'`.
3. `serverCreateReportRequest` writes the request doc with `fulfillmentByUser` initialized to `{ uid: { fulfilled: false } }` for each materialized target.
4. Each target user reports an item → `serverFulfillReportRequest` flips their fulfillment entry; status auto-advances `pending` → `partially_fulfilled` → `fulfilled`. 48h default expiry.

---

## 5. API surface

| Method | Route | Purpose | Body |
|--------|-------|---------|------|
| POST | `/api/equipment/batch` | Bulk create | `{ items, signedBy, signedById, actor, notes? }` |
| POST | `/api/equipment/report` | Record report | `{ equipmentId, photoUrl, actor, actorName, note? }` |
| POST | `/api/equipment/retire` | Retire (immediate or request) | `{ equipmentId, actor, actorName, reason }` |
| POST | `/api/equipment/transfer` | Approved transfer write | as `transferRequestService` payload |
| POST | `/api/transfer-requests/approve`, `/reject` | Transfer request workflow | `{ transferRequestId, ... }` |
| POST | `/api/retirement-requests/approve`, `/reject` | Retirement request workflow | `{ requestId, approverUserId, approverUserName, note? }` |
| POST | `/api/report-requests` | Create report request | `{ actor, scope, targetUserIds[], targetTeamId?, targetEquipmentDocIds?, note? }` |
| POST | `/api/report-requests/fulfill` | Mark a target user as fulfilled | `{ requestId, userId }` |
| POST | `/api/equipment-templates/propose` | TL/user template proposal | `{ actor, name, category, ..., draftPayload? }` |
| POST | `/api/equipment-templates/approve` | Manager approval | `{ actor, templateId, edits? }` |
| POST | `/api/equipment-templates/reject` | Manager rejection | `{ actor, templateId, reason? }` |
| POST | `/api/equipment-drafts` | Draft CRUD (user-scoped) | varied |
| POST | `/api/force-ops` | Force holder/signer change | `{ actor, equipmentDocIds[], kind, targetUserId, reason }` |

Every policy-relevant route gates via `equipmentPolicy` through `policyHelpers` (`actorToAuthUser` + role/scope checks). Token verification on the actor payload is **not yet wired** — tracked as the next hardening item in `docs/spec/firestore-refactor.md`.

---

## 6. UI map

| Surface | File | Role |
|---------|------|------|
| `/equipment` page | `src/app/equipment/page.tsx` | Tabs (Self/Team/All) + Filter + Table + BulkActionBar + modals |
| Tabs | `EquipmentTabs.tsx` | Scope selector (All gated by manager+) |
| Table | `EquipmentTable.tsx` | Expandable rows + dimmed-state + stale badge + selection |
| Row actions | `EquipmentRowActions.tsx` | Per-row dropdown gated by policy |
| Bulk bar | `BulkActionBar.tsx` | Floating action bar |
| Add wizard | `AddEquipmentWizard.tsx` + `wizard/{Mode,Template,Details,Review}.tsx` | 4-step sign-up; mounts `RequestNewTemplateFlow` from "didn't find?" |
| Report modal | `ReportModal.tsx` | Camera + bypass-photo gate |
| Return modal | `ReturnModal.tsx` | Immediate vs request copy |
| Transfer modal | `TransferModal.tsx` | User search + reason |
| History panel | `ActionHistoryPanel.tsx` | Merged tracking + actionsLog timeline |
| Camera | `src/components/camera/CameraCapture.tsx` | getUserMedia wrapper with file fallback |
| Welcome modal | `src/components/onboarding/WelcomeModal.tsx` | Mounted by AppShell when teamId/unitId missing |
| Templates tab | `src/components/management/tabs/TemplatesTab.tsx` | Canonical / proposed / pending review |
| Force ops tab | `ForceOperationsTab.tsx` | Items picker + kind + target + reason |
| Retirement approval tab | `RetirementApprovalTab.tsx` | Pending + recent-decided audit |
| Report request tab | `ReportRequestTab.tsx` | Scope selector + recent + fulfillment progress |

Notification routing lives in `NotificationItem.tsx`'s `resolveNotificationTarget` — see `docs/codebase/src/components/notifications/NotificationItem.md`.

---

## 7. Test coverage

| File | Status | Coverage |
|------|--------|----------|
| `src/lib/__tests__/equipmentPolicy.test.ts` | Phase 3 | 30 tests, full role × scope matrix |
| `src/lib/__tests__/serverServices.test.ts` | Phase 8 | 9 tests — `validateActor`, `actorToAuthUser`, `serverForceOps` input validation |
| Server txn invariants (denormalized field sync, action-log writes, batch atomicity) | Deferred | Requires a true firebase-admin SDK fake. Tracked as a follow-up. |

---

## 8. Out of scope (parking lot)

- Daily cron reminders for stale reports (deferred for Firebase Functions billing complexity; client staleness badge + manager ad-hoc requests cover the gap).
- Companion templates ("usually comes with") — schema-ready via `companionTemplateIds`; no UI yet.
- Team-scoped Firestore read rules — all reads currently `authenticated`. Service-layer filtering covers scope. Tightening rules is a separate hardening pass.
- Token verification on API routes — still trusts the `actor` payload from the client. Tracked in `docs/spec/firestore-refactor.md`.
- OTP-based transfer approval, CSV export, QR-scan S/N entry, maintenance scheduling, offline photo queue — all schema-ready; no UI in phase 1.
- Bulk transfer in `BulkActionBar` (currently a no-op stub steering users to ForceOps).
- Bulk retire in `BulkActionBar` (`allowRetire={false}` by default).

---

## 9. Verification script (manual)

Run after a clean dev seed. Use four test accounts: `soldier@`, `tl@`, `manager@`, plus a fresh `soldier2@` with no team/unit set.

1. **WelcomeModal**: `soldier2@` logs in → modal blocks UI until team/unit filled.
2. **Canonical template creation**: `manager@` → TemplatesTab → "Create" → save Rifle M4 with `requiresSerialNumber=true`.
3. **Soldier signs up**: `soldier@` → wizard → Rifle M4 → S/N "R001" + photo. Assert: appears under "שלי" tab; both `signedById` and `currentHolderId` = `soldier@`; both team fields match soldier's teamId.
4. **Bulk add**: 3 distinct S/Ns + 3 photos. Assert: shared `batchId`, 3 separate action logs.
5. **"Not in list"**: `soldier@` → wizard → "didn't find?" → fills new template → submits. Assert: `pending_request` template created; `equipmentDrafts/{id}` saved; `manager@` notification fired.
6. **Manager approves request**: edits + approves. Assert: template now `canonical`; `soldier@` receives `template_request_approved`; click → wizard re-opens with S/N + photo pre-filled; submit succeeds; draft deleted.
7. **Report**: `soldier@` reports an item with photo. Assert: `lastReportUpdate` fresh, `lastReportPhotoUrl` set.
8. **Bypass-photo report**: `tl@` reports without photo. Assert: action log notes bypass.
9. **Transfer**: `soldier@` → request to `tl@` → `tl@` approves. Assert: holder = tl, dimmed-row appears in `soldier@`'s "שלי" tab.
10. **Return from non-holder**: `soldier@` (signer, no longer holder) → Return → request created → `tl@` (holder) receives notification → approves. Assert: item `status='retired'`.
11. **Non-signer can't retire**: `tl@` (holder, not signer) on a different item → Return UI absent; direct API → 403.
12. **Report request — TEAM scope**: `manager@` → ReportRequestTab → scope=team, teamId=soldier's team. Assert: every active user on that team receives `report_requested`. Each fulfillment tracked in `fulfillmentByUser`.
13. **Force ops**: `manager@` → ForceOperationsTab → 3 items → kind=both → target=`soldier2@` → reason → execute. Assert: all 3 items updated atomically; team/unit fields match soldier2's; 3 action logs; displaced parties notified.
14. **Permission boundaries**: as `soldier@`, direct POST to `/api/force-ops` → 403.
15. **Team tab scope**: `soldier@` "הצוות שלי" → only items where holder or signer is in soldier's team; "הכול" tab absent for soldier; present for manager.
