# BulkActionBar

**File:** `src/components/equipment/BulkActionBar.tsx`

Floating sticky bar that surfaces when one or more rows are selected. Mirrors the visual pattern of `src/app/components/SelectionBar.tsx` but lives in the equipment domain.

## Phase-1 scope

- **Bulk report**: walks the selection and reports each item with no photo. Intended for privileged users (TL+); regular soldiers must report items individually because each requires its own photo.
- **Bulk transfer**: not yet wired in this component (the user is steered to `/management` Force-Ops for cross-team / multi-target moves).
- **Bulk retire**: hidden by default. Intended for manager+ tooling, currently `allowRetire={false}` in the page.

## Why this lives outside the table

Selection state is owned by the page so it survives tab switches and table re-renders. The bar reads only the *count* and emits intents — the page maps intents to service calls.
