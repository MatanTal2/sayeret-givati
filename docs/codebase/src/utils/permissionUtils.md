# utils/permissionUtils.ts

**File:** `src/utils/permissionUtils.ts`  
**Lines:** 80  
**Status:** Active

## Purpose

User permission and access control helper functions based on `UserType`.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `hasEquipmentManagementAccess` | `(user) => boolean` | ADMIN, SYSTEM_MANAGER, or MANAGER |
| `hasAdminAccess` | `(user) => boolean` | ADMIN only |
| `hasManagerAccess` | `(user) => boolean` | ADMIN, SYSTEM_MANAGER, or MANAGER |
| `canModifyOthersEquipment` | `(user) => boolean` | Same as hasEquipmentManagementAccess |
| `getUserPermissionLevel` | `(user) => number` | Numeric permission level (0-4) |
