# Equipment statuses: EXCHANGE + STORED — Specification

> **Status:** Spec only — code not started.
> **Queued:** 2026-05-13.
> **Related:** `docs/spec/equipment-flow.md` (canonical equipment lifecycle), `project_equipment_new_statuses.md` (memory pointer).

---

## 1. Context

Two new `EquipmentStatus` values:

1. **`EXCHANGE_REQUESTED`** (Hebrew: `החלפה`) — holder's item is broken, needs swap for a new physical item. Distinct from `REPAIR` (which implies same item returns). Approval flow: holder requests → signer approves (or signer initiates "replace by another"). After replacement the new physical item gets a new צ (serial); old doc is retired and linked to the new doc so history is preserved end-to-end.

2. **`STORED`** (Hebrew: `מאוחסן`) — end-of-round, army keeps physical item but the user keeps logical ownership. Same serial returns to the same user when the next round opens. Daily-check skip. No transfers while stored. History shows storage entries with a colored background.

User-confirmed decisions (2026-05-13):

- Old doc on exchange → status `RETIRED`, `successorDocId` link added. Existing actionsLog stays on the old doc. New doc has `predecessorDocId` link back. ActionHistoryPanel walks the chain.
- New doc inherits: template/productName/category, holder, signer. Condition resets to `GOOD`.
- Storage trigger: holder (from row action menu). Pull-from-storage gated by `SystemConfig.roundOpen === true`.
- History viz: tinted row background for STORE/REISSUE entries (and EXCHANGE entries).

Existing patterns being mirrored:

- **Retirement two-step flow** (`src/lib/db/server/retirementRequestService.ts`) — request → approver flips status. Exchange is the same shape with reversed roles (holder requests → signer approves).
- **SystemConfig** at `systemConfig/main` (`src/lib/db/server/systemConfigService.ts`) — adding a new boolean `roundOpen` field. Admin/sysman/manager toggle from `SystemConfigTab.tsx`.
- **ActionHistoryPanel** (`src/components/equipment/ActionHistoryPanel.tsx`) — adding row-background tinting per actionType.

---

## 2. Plan

### Phase 1 — Type system + constants

**`src/types/equipment.ts`**

- Extend `EquipmentStatus` enum: add `EXCHANGE_REQUESTED = 'exchange_requested'`, `STORED = 'stored'`. Keep `RETIRED` terminal for replaced items (no new `EXCHANGED` status — `RETIRED` + `successorDocId` is sufficient).
- Add fields to `Equipment` interface:
  - `predecessorDocId?: string` — present on docs created via exchange; points to the doc that was replaced.
  - `successorDocId?: string` — present on retired docs that were exchanged; points to the new doc.
- Extend `ActionType` enum (line 395+): add `EXCHANGE_REQUESTED`, `EXCHANGE_APPROVED`, `EXCHANGE_REJECTED`, `EXCHANGE_COMPLETED`, `STORED`, `REISSUED`.
- Optional: matching `EquipmentAction` enum values (line 150+) for consistency with existing audit code.

**`src/types/ammunition.ts`** (where `SystemConfig` lives)

- Add `roundOpen: boolean` to `SystemConfig` interface. Default `false`.

**`src/constants/text.ts`**

- New keys under `FEATURES.EQUIPMENT`:
  - `STATUS_EXCHANGE_REQUESTED`, `STATUS_STORED` (Hebrew labels).
  - `ACTION_REQUEST_EXCHANGE`, `ACTION_APPROVE_EXCHANGE`, `ACTION_REJECT_EXCHANGE`, `ACTION_REPLACE_BY_ANOTHER`, `ACTION_SEND_TO_STORAGE`, `ACTION_PULL_FROM_STORAGE`.
  - `EXCHANGE_MODAL_TITLE` + reason placeholder.
  - `STORAGE_ROUND_CLOSED_TOOLTIP` ("Round is not currently open").

### Phase 2 — Server: exchange request flow

**New file:** `src/lib/db/server/exchangeRequestService.ts`. Mirror `retirementRequestService.ts` shape.

- `serverRequestExchange({ equipmentDocId, actor, reason })`:
  - Permission: `actor.uid === equipment.currentHolderId` (holder only).
  - Pre-check: status === `AVAILABLE`.
  - Mutate: `equipment.status = EXCHANGE_REQUESTED`.
  - actionsLog: `actionType = EXCHANGE_REQUESTED`, `note = reason`.
  - Create `exchangeRequests/{id}` doc: `{ equipmentDocId, holderUid, signerUid, reason, status: 'pending', createdAt }`.

- `serverApproveExchangeRequest({ requestId, actor, newSerialNumber })`:
  - Permission: `actor.uid === equipment.signedById` (signer only).
  - `newSerialNumber` must be unique (doc-existence check on `equipment/{newSerialNumber}`).
  - Atomic batch:
    1. Old doc: `status = RETIRED`, `successorDocId = newSerialNumber`.
    2. Create new doc at `equipment/{newSerialNumber}`: copy `productName`, `category`, `subcategory`, `currentHolderId`, `currentHolder`, `signedById`, `signedBy`, `equipmentTypeId`, `requiresDailyStatusCheck`; set `id = newSerialNumber`, `condition = GOOD`, `status = AVAILABLE`, `predecessorDocId = oldDocId`.
    3. actionsLog on old doc: `EXCHANGE_COMPLETED` with note referencing new serial.
    4. actionsLog on new doc: `EQUIPMENT_CREATED` + `EXCHANGE_COMPLETED` with note referencing old serial.
    5. exchangeRequest: `status = 'approved'`.

- `serverRejectExchangeRequest({ requestId, actor, reason })`:
  - Permission: signer.
  - Revert `equipment.status` to `AVAILABLE`.
  - actionsLog: `EXCHANGE_REJECTED`.
  - exchangeRequest: `status = 'rejected'`.

- `serverReplaceByAnother({ equipmentDocId, actor, newSerialNumber })`:
  - Signer-direct path (skips the request step). Permission: signer.
  - Same atomic batch as `serverApproveExchangeRequest` but no exchangeRequest doc needed (or create one with `status='approved', initiatedBySigner: true`).

### Phase 3 — Server: storage flow

Add to `src/lib/db/server/equipmentService.ts`:

- `serverSendToStorage({ equipmentDocId, actor })`:
  - Permission: `actor.uid === equipment.currentHolderId`.
  - Pre-check: status === `AVAILABLE`.
  - Mutate: `status = STORED`.
  - actionsLog: `STORED`.

- `serverPullFromStorage({ equipmentDocId, actor })`:
  - Permission: `actor.uid === equipment.currentHolderId`.
  - Pre-check: status === `STORED` AND `SystemConfig.roundOpen === true`.
  - Mutate: `status = AVAILABLE`.
  - actionsLog: `REISSUED`.

Guards:

- Transfer-request creation: reject if `equipment.status === STORED`.
- Daily-check query: exclude `status === STORED`. Find the query in `src/lib/db/` (likely `dailyCheckService.ts` or equivalent) and add `where('status', '!=', 'stored')` (or `where('status', 'in', [...allowed])`).

### Phase 4 — SystemConfig: roundOpen toggle

- `src/lib/db/server/systemConfigService.ts`: add `roundOpen` to `SystemConfigUpdatableFields`, `SystemConfigPayload`, and `validateSystemConfigPayload`.
- `src/app/api/system-config/route.ts`: widen the existing `isSystemAdmin` helper (ADMIN | SYSTEM_MANAGER) to ALSO accept MANAGER — confirm at implementation. User said admin/sysman/manager.
- `src/components/management/tabs/SystemConfigTab.tsx`: add a Switch (Headless UI) for `roundOpen` with help-text explaining storage behavior.
- `src/hooks/useSystemConfig.ts`: ensure new field round-trips.

### Phase 5 — UI: row actions

**`src/components/equipment/EquipmentRowActions.tsx`**

Add new action IDs to `EquipmentRowAction` type and to the actions array:

| Action | Visible when | Permission | Dispatches |
|---|---|---|---|
| `request-exchange` | status === AVAILABLE | holder | `ExchangeRequestModal` |
| `approve-exchange` | status === EXCHANGE_REQUESTED | signer | `ApproveExchangeModal` (asks for new serial) |
| `reject-exchange` | status === EXCHANGE_REQUESTED | signer | `RejectExchangeModal` (reason) |
| `replace-by-another` | status === AVAILABLE | signer | `ApproveExchangeModal` (no prior request) |
| `send-to-storage` | status === AVAILABLE | holder | Confirm + `serverSendToStorage` |
| `pull-from-storage` | status === STORED AND roundOpen | holder | Confirm + `serverPullFromStorage`. When `roundOpen=false`, render disabled with `STORAGE_ROUND_CLOSED_TOOLTIP`. |

Permission helpers in `src/lib/equipmentPolicy.ts` (alongside `canReport`, `canTransfer`, `canRetire`): `canRequestExchange`, `canApproveExchange`, `canSendToStorage`, `canPullFromStorage`.

### Phase 6 — UI: status badge

**`src/components/equipment/EquipmentStatus.tsx`**

Add cases to `getText` and `getStatusColor`:

- `EXCHANGE_REQUESTED` → label `החלפה - ממתין לאישור`, color = warning (orange).
- `STORED` → label `מאוחסן`, color = info (blue) with package icon.

### Phase 7 — UI: history visualization

**`src/components/equipment/ActionHistoryPanel.tsx`**

- Walk the predecessor chain: if `equipment.predecessorDocId` is set, fetch actionsLog for that doc and prepend (chronological). Recursive if multiple predecessors.
- Style row backgrounds by actionType:
  - `STORED`, `REISSUED` → `bg-info-50`.
  - `EXCHANGE_REQUESTED`, `EXCHANGE_APPROVED`, `EXCHANGE_REJECTED`, `EXCHANGE_COMPLETED` → `bg-primary-50`.
- Header pill on the new doc: when `predecessorDocId` is set, show a `החלפה` pill linking to the old serial.

### Phase 8 — New modals

Headless UI `Dialog` (per `feedback_ui_libs`, `feedback_no_browser_dialogs`):

- `src/components/equipment/ExchangeRequestModal.tsx` — textarea for reason. Submit → `serverRequestExchange`.
- `src/components/equipment/ApproveExchangeModal.tsx` — input for new serial (validated unique). Submit → `serverApproveExchangeRequest` or `serverReplaceByAnother`.
- `src/components/equipment/RejectExchangeModal.tsx` — textarea for reason. Submit → `serverRejectExchangeRequest`.
- Storage triggers: reuse existing `ConfirmationModal` (single-button confirm — no dedicated modal needed).

### Phase 9 — Specs + docs

- This file (`docs/spec/equipment-exchange-and-storage.md`) is the canonical reference. `project_equipment_new_statuses.md` becomes a historical pointer once code starts.
- Update `docs/codebase/src/lib/db/server/` with new `exchangeRequestService.md` + diffs to `equipmentService.md` and `systemConfigService.md`.
- Update `docs/codebase/src/types/equipment.md` with new enum values + new fields.

---

## 3. Critical files

- `src/types/equipment.ts` — enums + Equipment fields.
- `src/types/ammunition.ts` — SystemConfig field.
- `src/lib/db/server/exchangeRequestService.ts` — NEW.
- `src/lib/db/server/equipmentService.ts` — storage transitions + STORED transfer block.
- `src/lib/db/server/systemConfigService.ts` — `roundOpen`.
- `src/lib/equipmentPolicy.ts` — new permission helpers.
- `src/components/equipment/EquipmentRowActions.tsx` — new menu items.
- `src/components/equipment/EquipmentStatus.tsx` — new badge cases.
- `src/components/equipment/ActionHistoryPanel.tsx` — predecessor chain walk + row background.
- `src/components/equipment/ExchangeRequestModal.tsx` / `ApproveExchangeModal.tsx` / `RejectExchangeModal.tsx` — NEW.
- `src/components/management/tabs/SystemConfigTab.tsx` — `roundOpen` toggle.
- `src/constants/text.ts` — new labels.

---

## 4. Verification

1. **Type-check + lint:** `npm run lint` + `npx tsc --noEmit` clean.
2. **Unit tests:** `src/lib/__tests__/exchangeRequestService.test.ts` mirroring `retirementRequestService.test.ts` — request happy path, signer-rejects, replace-by-another, double-request rejected, etc.
3. **Manual QA (dev server):**
   - Create equipment as user A (holder). Sign as user B (signer).
   - As A: Request Exchange → status badge flips to `EXCHANGE_REQUESTED`.
   - As B: approve with new serial → old doc retired with `successorDocId`, new doc created with `predecessorDocId`, both actionsLog entries written.
   - As A on new doc: open `ActionHistoryPanel` → old doc's history is prepended (chain walk); EXCHANGE entries have tinted background.
   - As A: Send to Storage → status `STORED`, daily-check list excludes it, transfer attempts rejected.
   - As admin: toggle `roundOpen=true` in `SystemConfigTab`.
   - As A: Pull from Storage → status `AVAILABLE`, `REISSUED` entry in history.
   - Toggle `roundOpen=false` → re-store the item → Pull-from-Storage action disabled with tooltip.
4. **RTL spot-check:** all new modals + the SystemConfig switch use logical Tailwind (`ps-`/`pe-`/`ms-`/`me-`/`text-start`/`text-end`).

---

## 5. Sequencing

Phases 1-2 (types + exchange server) → Phase 3-4 (storage server + SystemConfig) → Phase 5-7 (UI wiring) → Phase 8 (modals) → Phase 9 (docs). Single feature branch `feat/equipment-exchange-and-storage`. Sized for 2 sessions; ship in one PR when both statuses pass manual QA.
