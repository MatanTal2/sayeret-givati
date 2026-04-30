# useSidebar.ts

**File:** `src/hooks/useSidebar.ts`
**Status:** Active

## Purpose

Manages sidebar open/close state and active tab for the management interface.

## Return Shape

```typescript
{
  isOpen, activeTab,
  setSidebarOpen, toggleSidebar, setActiveTab, closeSidebarOnMobile
}
```

## Active-tab persistence

Active tab is stored in the URL as `?tab=<tabId>`. A page refresh keeps
the user on the tab they were viewing instead of resetting to the first
available tab. `setActiveTab` writes via `router.replace` (no history
entry, no scroll jump). The query key is exported as
`SIDEBAR_TAB_QUERY_KEY`.

If no `?tab=` param is present, `activeTab` falls back to the
`defaultTab` argument passed by the consumer.

Sidebar `isOpen` remains local component state — no need to survive
navigation.
