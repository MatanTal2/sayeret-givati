# Feature: Management Dashboard

## What Exists (Implemented)

A role-gated management dashboard at `/management` with a sidebar navigation and 8 tab-based sections. Access is controlled by `useManagementAccess` which checks the user's `UserType` and `ManagementPermissions`. The original page was 2321 lines and has been refactored into a sidebar + tabs architecture.

**Primary page:** `src/app/management/page.tsx` (123 lines)  
**Access control hook:** `src/hooks/useManagementAccess.ts` (76 lines)  
**Tab config hook:** `src/hooks/useManagementTabs.ts` (168 lines)  
**Sidebar state hook:** `src/hooks/useSidebar.ts` (56 lines)

---

## User Stories

### Access Control
- As a user without management access, I see an "access denied" message and cannot use any tabs.  
  **Status:** ✅ Implemented
- As a manager/admin, I can access the management dashboard.  
  **Status:** ✅ Implemented
- As a user, individual tabs may be further restricted by specific permission flags.  
  **Status:** ✅ Implemented (per-tab permission checks in `TabContentRenderer`)

### Navigation
- As a manager, I can navigate between tabs using the sidebar.  
  **Status:** ✅ Implemented (`ManagementSidebar.tsx`)
- As a user on mobile, I can open/close the sidebar via a hamburger button.  
  **Status:** ✅ Implemented (`MobileMenuButton.tsx`, `useSidebar.ts`)
- As a user, tabs are grouped by category in the sidebar.  
  **Status:** ✅ Implemented (`useManagementTabs.ts`)

---

## Tabs

### Users Tab (`UsersTab.tsx`, 324 lines ⚠️)
- View all registered users
- Search by name/email
- Update communication preferences
**Status:** ✅ Implemented

### Template Management Tab (`TemplateManagementTab.tsx`, 328 lines ⚠️)
- View all equipment templates
- Create new equipment type templates
- Edit existing templates
**Status:** ✅ Implemented

### Email Tab (`EmailTab.tsx`, 333 lines ⚠️)
- Compose and send broadcast emails to users
- Select recipients by user type or individually
**Status:** ✅ Implemented (Brevo email integration)

### Permissions Tab (`PermissionsTab.tsx`, 105 lines)
- View and edit user role assignments
**Status:** 🔄 Partial — UI exists, write operations may be incomplete

### Permission Grants Tab (`PermissionGrantsTab.tsx`)
- ADMIN + SYSTEM_MANAGER only.
- List active grants and full history (active / expired / revoked) with `isExpired` and effective-status badges.
- Issue a time-limited role bump (TEAM_LEADER / MANAGER / SYSTEM_MANAGER), scoped to a single team or to all teams. Duration capped at 7 days.
- Revoke an active grant with optional reason.
- Backed by `usePermissionGrants` → `/api/permission-grants` (GET / POST + `/{id}/revoke`). Server logic in `src/lib/db/server/permissionGrantsService.ts`. The grantee is notified on issue.
**Status:** ✅ Implemented

### Data Management Tab (`DataManagementTab.tsx`, 138 lines)
- Import / export data
- Sync operations
**Status:** 🔄 Partial — structure exists, specific operations vary

### System Config Tab (`SystemConfigTab.tsx`, 135 lines)
- System-level settings
**Status:** 🔄 Partial — UI structure exists

### Enforce Transfer Tab (`EnforceTransferTab.tsx`, 155 lines)
- Commander-level forced equipment transfer between holders
**Status:** 🔄 Partial — uses `CustomUserSelectionModal.tsx` for target selection; full enforcement path needs review

### Audit Logs Tab (`AuditLogsTab.tsx`, 183 lines)
- View all `actionsLog` entries
- Filter by actor, equipment, action type
**Status:** ✅ Implemented

---

## In-Progress / TODO

- Permissions tab write path: changing user roles from UI may not be fully wired.
- Data management tab: specific import/export operations need review.
- System config tab: which settings are actually persisted vs. display-only is unclear.
- Enforce transfer: end-to-end flow from selection to transfer approval not tested.

---

## Screens / Routes Involved

| Screen | File |
|--------|------|
| Main page | `src/app/management/page.tsx` |
| Sidebar layout | `src/components/management/sidebar/ManagementSidebar.tsx` |
| Sidebar header | `src/components/management/sidebar/SidebarHeader.tsx` |
| Sidebar nav items | `src/components/management/sidebar/SidebarNavigation.tsx` |
| Sidebar footer | `src/components/management/sidebar/SidebarFooter.tsx` |
| Page header | `src/components/management/header/ManagementHeader.tsx` |
| App logo | `src/components/management/header/AppLogo.tsx` |
| Mobile menu button | `src/components/management/header/MobileMenuButton.tsx` |
| Page info (title) | `src/components/management/header/PageInfo.tsx` |
| Tab router | `src/components/management/tabs/TabContentRenderer.tsx` |
| Users tab | `src/components/management/tabs/UsersTab.tsx` |
| Templates tab | `src/components/management/tabs/TemplateManagementTab.tsx` |
| Email tab | `src/components/management/tabs/EmailTab.tsx` |
| Permissions tab | `src/components/management/tabs/PermissionsTab.tsx` |
| Data management tab | `src/components/management/tabs/DataManagementTab.tsx` |
| System config tab | `src/components/management/tabs/SystemConfigTab.tsx` |
| Equipment creation tab | `src/components/management/tabs/EquipmentCreationTab.tsx` |
| Enforce transfer tab | `src/components/management/tabs/EnforceTransferTab.tsx` |
| Audit logs tab | `src/components/management/tabs/AuditLogsTab.tsx` |
| User selection modal | `src/components/management/tabs/CustomUserSelectionModal.tsx` |
| Access control hook | `src/hooks/useManagementAccess.ts` |
| Tab config hook | `src/hooks/useManagementTabs.ts` |
| Sidebar state hook | `src/hooks/useSidebar.ts` |
