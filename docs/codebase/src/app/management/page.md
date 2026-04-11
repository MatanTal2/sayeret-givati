# page.tsx (Management)

**File:** `src/app/management/page.tsx`
**Lines:** 123
**Status:** Active

## Purpose

Management dashboard (`/management`). Thin shell that composes sidebar, header, and tab content. Access control and tab routing are fully delegated to hooks. The original version was 2321 lines — this is the post-refactor version. Protected by `AuthGuard`.

## Exports / Public API

- `default ManagementPage` — Next.js page component. Wraps `ManagementContent` in `AuthGuard`.
- `ManagementContent` (local, not exported) — actual implementation; uses `useManagementAccess`, `useManagementTabs`, `useSidebar`.

## State

All state delegated to hooks:
- Access control: `useManagementAccess` → `{ user, permissions, isLoading }`
- Tab config: `useManagementTabs` → `{ tabsByCategory, getTabById, defaultTabId }`
- Sidebar/navigation: `useSidebar` → `{ isOpen, activeTab, setSidebarOpen, setActiveTab }`

## Notes

- Shows access-denied view if `!permissions.canAccessManagement`.
- `dir="rtl"` on the access-denied wrapper div — redundant.
