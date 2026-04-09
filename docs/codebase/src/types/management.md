# types/management.ts

**File:** `src/types/management.ts`  
**Lines:** 116  
**Status:** Active

## Purpose

Management dashboard types: tab definitions, permission flags, and template data shapes.

## Exports

- `ManagementTab` — `{ id, name, description, icon, category, requiredPermission? }`
- `TabCategory` — category grouping
- `TemplateData` — template display shape
- `ManagementPermissions` — granular permission flags
- `ManagementContext` — `{ user, permissions, isLoading }`
