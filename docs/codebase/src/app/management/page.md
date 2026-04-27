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
- The outer wrapper carries `overflow-x-hidden` to stop the closed mobile sidebar (translated off-screen via `translate-x-full`) from inflating the document width and pushing the layout to the right.
- No `dir="rtl"` on this page — the global `<html dir="rtl">` in `src/app/layout.tsx` is the single source.
