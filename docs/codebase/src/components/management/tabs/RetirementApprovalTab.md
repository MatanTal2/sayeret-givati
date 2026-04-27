# RetirementApprovalTab

**File:** `src/components/management/tabs/RetirementApprovalTab.tsx`

Manager-side **oversight** view of pending `retirementRequests`.

## What it shows

Pending requests created when a signer wants to retire an item they don't currently hold. Each row: equipment, signer (initiator), holder (approver), reason, date, status.

## Audit panel (Phase 8)

`getRecentDecidedRetirementRequests(limit)` runs three Firestore queries (`status in {approved, rejected, cancelled}`) and merges them client-side, sorted by `createdAt`. Used by the second card on the tab.

## What it does **not** do

- Does not approve or reject. The actual approver is the **holder** via their `RETIREMENT_REQUEST_APPROVAL` notification on `/equipment`. Manager+ here only monitors the queue.

## Permission

Tab visibility gated through `useManagementTabs` via `isManagerOrAbove(user) || canBulkOps(user)`.
