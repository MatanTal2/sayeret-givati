# SidebarNavigation.tsx

**File:** `src/components/management/sidebar/SidebarNavigation.tsx`
**Status:** Active

## Purpose

Renders categorized tab navigation items with sorting and hover effects. Tabs are grouped by category with Hebrew category headers.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `string` | ✅ | Currently active tab ID |
| `tabsByCategory` | `Record<string, ManagementTab[]>` | ✅ | Tabs grouped by category |
| `onTabChange` | `(tabId: string) => void` | ✅ | Tab selection handler |

## Scroll affordance (bug #20)

The tab list can grow to 14 items across 4 categories — on short viewports it overflows the sidebar height. The `<nav>` is `overflow-y-auto min-h-0`, wrapped in a `relative flex-1` container with two `aria-hidden` gradient overlays:

- **Top fade** (`from-white to-transparent`) appears when `scrollTop > 4`.
- **Bottom fade** (`from-transparent to-white`) appears when content extends below the viewport.

Scroll state is recomputed on `scroll` events and on `ResizeObserver` callbacks against the nav element. Overlays use `transition-opacity` so they fade in/out smoothly. They're decorative — keyboard / wheel / touch scrolling remains the actual mechanism.

Pre-requisite: `ManagementSidebar` root is `flex flex-col` so the nav's `flex-1` constrains height. Without it the nav stretched freely and content was silently clipped.

## Known Issues

- Category names hardcoded in Hebrew (sort order array).
