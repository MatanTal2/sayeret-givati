# /logistics page

**File:** `src/app/logistics/page.tsx`
**Status:** Active
**User-facing title:** אפסנאות (renamed from לוגיסטיקה)

## Purpose

Inventory management for non-serialized supplies — the unit's "אפסנאות"
catalogue. Mirrors the equipment page UX but each row is a quantity-tracked
entry (no צ/serial number, no exchange flow, no daily report). Items are
created from templates managed in `Management → תבניות אפסנאות` (see
`LogisticsTemplatesTab.md`).

## Composition

```
AuthGuard
  AppShell (title = "📦 אפסנאות")
    LogisticsInventoryPage
      ├ Add-item button (TL+)
      ├ FilterBar (search + category + subcategory dropdowns)
      └ Inventory table | empty-state | loading | error
      ├ AddLogisticsItemModal  (pick template → quantity/location/holder/notes)
      └ EditLogisticsItemModal (quantity/location/holder/notes)
```

## Data flow

- Reads `logisticsItems` via `useLogisticsItems` hook (client SDK, sorted by name).
- Writes via `apiFetch` → `POST/PUT/DELETE /api/logistics-items` (TL+ gate).
- Categories + subcategories are taken from the **items themselves** (distinct
  values, RTL-sorted). The item snapshots `name`/`category`/`subcategory` from
  its template at create time, so later template renames do not silently
  rewrite the inventory rows.
- Subcategory filter is scoped by the active category filter: pick a category
  → the subcategory dropdown narrows accordingly.

## Permissions

- View: any authenticated user.
- Create / edit / delete: ADMIN / SYSTEM_MANAGER / MANAGER / TEAM_LEADER.
  Enforced on `/api/logistics-items`; UI hides the buttons for everyone else.

## Firestore rules + indexes

The page relies on two collections — `logisticsTemplates` (managed under
`Management → תבניות אפסנאות`) and `logisticsItems`. Both have authenticated-
read rules in `firebase/firestore.rules`; writes are server-only. The template
read uses `where('isActive','==',true) + orderBy('name')`, which requires the
composite index `logisticsTemplates(isActive, name)` in
`firebase/firestore.indexes.json`. Without the rule entries the default
deny-all match silently empties the templates list, which leaves the Add-item
button disabled and surfaces the misleading "no templates" banner. Deploy
both with `firebase deploy --only firestore:rules,firestore:indexes` after
any change.

## Empty states

- No templates → info banner directing managers to `Management → תבניות
  אפסנאות`; the Add button stays disabled.
- No items → "אין פריטים. הוסף פריט ראשון."
- Filter matches nothing → "לא נמצאו פריטים התואמים לסינון."

## Holder

The first cut stores `currentHolderName` only — a freeform string, not a
user reference. Upgrading this to a real `UserSearchInput`-backed holder
(plus per-user item views) is a follow-up.
