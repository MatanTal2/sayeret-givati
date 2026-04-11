# useManagementAccess.ts

**File:** `src/hooks/useManagementAccess.ts`  
**Lines:** 76  
**Status:** Active

## Purpose

Determines user permissions for management features based on `UserType`. Returns a `ManagementContext` with granular permission flags.

## Exports

| Export | Return Shape | Description |
|--------|-------------|-------------|
| `useManagementAccess` | `ManagementContext` | `{ user, permissions: { canAccessManagement, canManageUsers, canManagePermissions, canManageTemplates, canManageSystem, canSendEmails, canViewAuditLogs }, isLoading }` |
| `useManagementPermission` | `boolean` | Checks a single permission flag |
