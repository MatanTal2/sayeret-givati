# TemplateManagementTab.tsx

**File:** `src/components/management/tabs/TemplateManagementTab.tsx`  
**Lines:** 329 ⚠️ LONG  
**Status:** Active

## Purpose

Equipment template CRUD interface with category/subcategory filtering and search. Opens `EquipmentTemplateForm` for creating new templates.

## State

| State | Type | Purpose |
|-------|------|---------|
| `searchTerm` | `string` | Text search |
| `selectedCategory` | `string` | Category filter |
| `selectedSubcategory` | `string` | Subcategory filter |
| `showCreateForm` | `boolean` | Show create template form |

## Known Issues

- Mock data hardcoded — some template data may not come from Firestore.
- Extensive inline Hebrew.
- 329 lines — at the split threshold.
