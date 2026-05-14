# CategoriesTab.tsx

**File:** `src/components/management/tabs/CategoriesTab.tsx`
**Status:** Active
**Tab id:** `categories` (Management → ניהול ציוד → קטגוריות)

## Purpose

Rename the names of equipment categories and subcategories without changing
their underlying IDs. The ID-based references in `equipmentTemplates` (and
anywhere else `useCategoryLookup` resolves an ID) keep working — only the
displayed name changes.

## Permission

`permissions.canManageTemplates` (ADMIN / SYSTEM_MANAGER / MANAGER). Same gate
as `template-management` and `equipment-creation`.

## Behavior

- Loads the full tree (`activeOnly: false`) via `CategoriesService.getCategories`.
- Each category row is a `<Disclosure>` — chevron toggles its subcategory list.
- Inline rename: pencil → text input + save / cancel. Enter to commit, Escape
  to cancel. Empty/whitespace-only names are rejected client-side.
- Save calls `CategoriesService.updateCategory({ name })` /
  `updateSubcategory({ name })` which delegate to `PUT /api/categories(...)`
  (firebase-admin write). After success, the tree is refreshed.
- Inactive (soft-deleted) rows are shown with `line-through` and a "לא פעיל"
  pill so admins can still find and rename them.

## What it does NOT do

- Does not create, deactivate, or reorder categories — those flows live
  elsewhere (and are intentionally not yet exposed in the UI for this tab).
- Does not propagate names anywhere — names are resolved on the fly via
  `useCategoryLookup` from the canonical document, so the rename is
  immediately visible everywhere the lookup is used.
