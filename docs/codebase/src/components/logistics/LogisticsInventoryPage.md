# LogisticsInventoryPage

**File:** `src/components/logistics/LogisticsInventoryPage.tsx`

Inventory landing for אפסנאות (non-serialized supplies). Mounted by `src/app/logistics/page.tsx` inside `AuthGuard` + `AppShell`. Templates seed the catalogue; items are quantity-tracked entries that inherit name + category from their template.

## Composition

```
LogisticsInventoryPage
  ├ "הוסף פריט" button   (privileged users only; disabled when no templates exist)
  ├ No-templates info banner (only when templates.length === 0)
  ├ Filter row
  │    ├ search input (full width)
  │    └ grid-cols-2: [category] [subcategory]
  ├ Inventory table   (or loading / error / empty / no-match state)
  └ AddLogisticsItemModal / EditLogisticsItemModal portals + toast
```

## Filters

Layout matches the phone-book pattern: full-width search on top, two filter dropdowns side-by-side at every breakpoint (`grid-cols-2 gap-2`).

- **search** — substring match on `name`, `category`, `subcategory`, `location`, `currentHolderName`.
- **category** — `string | null` picked from the categories actually present on items. Sorted with `localeCompare('he')`.
- **subcategory** — same shape, narrowed to the subcategories that occur under the currently selected category (or all when category is `'all'`).

Categories and subcategories are stored on `LogisticsItem` / `LogisticsTemplate` as **freeform strings**, not as references into the `categories` collection — this is intentional per `src/types/logistics.ts` (the unit-specific אפסנאות taxonomy is deliberately separate from the equipment categories collection). No id→name resolution is needed.

## Strings

Filter labels and the "הוסף פריט" button text come from `TEXT_CONSTANTS.FEATURES.LOGISTICS` in `src/constants/text.ts`:

- `SEARCH_PLACEHOLDER`, `ALL_CATEGORIES`, `ALL_SUBCATEGORIES`, `FILTER_BY_CATEGORY`, `FILTER_BY_SUBCATEGORY`, `ADD_ITEM`.

Remaining Hebrew strings in this component (empty states, toast messages, table headers, delete confirmation) are still inline and tracked as a follow-up cleanup.

## Permissions

`canEdit` is true for `ADMIN`, `SYSTEM_MANAGER`, `MANAGER`, `TEAM_LEADER` user types. Add/edit/delete actions are hidden from non-editors.
