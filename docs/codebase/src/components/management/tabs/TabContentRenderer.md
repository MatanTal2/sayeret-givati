# TabContentRenderer.tsx

**File:** `src/components/management/tabs/TabContentRenderer.tsx`  
**Lines:** 93  
**Status:** Active

## Purpose

Router component that conditionally renders the correct tab content based on `activeTab` ID. Maps each tab ID to its corresponding component (UsersTab, TemplateManagementTab, EmailTab, etc.). Shows a placeholder for unknown tabs.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `string` | ✅ | Current tab ID to render |
| `activeTabData` | `ManagementTab` | ✅ | Tab metadata |

## Known Issues

- Hardcoded Hebrew text in placeholder fallback.
