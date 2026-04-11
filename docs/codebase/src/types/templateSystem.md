# types/templateSystem.ts

**File:** `src/types/templateSystem.ts`  
**Lines:** 217  
**Status:** Active

## Purpose

Hierarchical template system types for equipment. Defines the category → subcategory → template hierarchy and includes helper functions for permission checking.

## Exports

- `TemplateCategory`, `TemplateSubcategory` — hierarchy types
- `TemplateDefaults` — default values for new equipment from template
- `CreateTemplateForm` — template creation form shape
- `getTemplatePermissions(userType)` — returns permission flags
- `canManageTemplates(userType)` — shorthand permission check
