# /equipment page

**File:** `src/app/equipment/page.tsx`

Phase 6 rewrite. The Step 1.2 dev stub is gone; this is now the soldier-facing lifecycle landing page.

## Composition

```
AuthGuard
  EquipmentErrorBoundary
    AppShell (mounts WelcomeModal if profile missing teamId/unitId)
      EquipmentPageContent
        ├ PageHeader  (+ הוסף ציוד button → opens AddEquipmentWizard)
        ├ EquipmentTabs (Self / Team / All — All gated by manager+)
        ├ FilterBar    (search + status filter)
        ├ EquipmentTable (or loading / error / empty state)
        └ BulkActionBar (sticky, surfaces when rows selected)
```

Modals (portal-style, not nested under AppShell): AddEquipmentWizard, ReportModal, ReturnModal, TransferModal, ActionHistoryPanel.

## Scope handling

The page hooks `useEquipment({ scope: 'self' })` and lets `EquipmentTabs` flip the scope. The hook re-derives the visible list via `equipmentPolicy.canView` plus a scope filter, so a tab change is a free local re-render — no re-fetch.

## URL → wizard auto-open

The page reads `resumeTemplate` and `resumeDraft` from the URL search params (set by `NotificationItem` on `template_request_approved` clicks). When either is present, the wizard opens automatically with those props; closing the wizard clears the params via `router.replace('/equipment')` so the page returns to a normal state.

## Bulk handling

- `report` runs sequentially across the selection with `photoUrl=null`. Useful for privileged users only; regular soldiers can't bypass the photo requirement, so the bulk path is effectively a TL+ feature.
- `transfer` is intentionally a no-op with a hint (cross-team / multi-target moves go through `/management` Force-Ops in Phase 7).
- `retire` is hidden by default (the bar passes `allowRetire={false}`).

## Removed

- The "Step 1.2 dev badge", the dev-mode debug card with permissions dump, and the `/test-dashboard` link banner — all artifacts of the discarded Step 1.2 stub.
