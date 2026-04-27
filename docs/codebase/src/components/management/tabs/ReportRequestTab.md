# ReportRequestTab

**File:** `src/components/management/tabs/ReportRequestTab.tsx`

Manager-side ad-hoc "report now" request creator + history view.

## Scopes

| Scope | Target source |
|-------|---------------|
| `user` | Single user via `UserSearchInput`. `targetUserIds = [target.uid]`. |
| `items` | Comma-separated S/Ns. Holder UIDs are derived from `equipment` state and sent as `targetUserIds`; the entered S/Ns travel as `targetEquipmentDocIds`. |
| `team` | `targetTeamId` text input. Client sends `targetUserIds: []`; server materializes from `users where teamId == targetTeamId AND status == 'active'`. |
| `all` | Client sends `targetUserIds: []`; server materializes from `users where status == 'active'`. |

The route validator only requires non-empty `targetUserIds` for `user` / `items` scopes; for `team` / `all` the server resolves the list (Phase 8 close-out).

## Submit path

`createReportRequest(args)` → `POST /api/report-requests` → `serverCreateReportRequest`. Server returns the new doc id. The tab refreshes its history list after every successful submit via the `feedback` effect dep.

## Recent panel

Lists requests created by the current user via `getReportRequestsByRequester(uid)`. Each row shows scope, optional note, fulfilled-of-total count derived from `fulfillmentByUser`, and a status badge.

## Permission

Tab visibility gated through `useManagementTabs` via `isManagerOrAbove(user) || canBulkOps(user)`.
