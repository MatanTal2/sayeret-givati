# ManagementHeader.tsx

**File:** `src/components/management/header/ManagementHeader.tsx`  
**Lines:** 42  
**Status:** Active

## Purpose

Top header bar for the management dashboard. Composes `MobileMenuButton`, `AppLogo`, `PageInfo`, and `AuthButton`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `ManagementTab` | ✅ | Current tab for `PageInfo` |
| `sidebarOpen` | `boolean` | ✅ | Sidebar state for mobile menu button |
| `onToggleSidebar` | `() => void` | ✅ | Toggle sidebar handler |
