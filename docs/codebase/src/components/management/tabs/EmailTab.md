# EmailTab.tsx

**File:** `src/components/management/tabs/EmailTab.tsx`  
**Lines:** 333 ⚠️ LONG  
**Status:** Active

## Purpose

Email composition interface with recipient filtering by role, team, and custom user selection. Shows subject, message body, and priority fields. Email sending is logged but **not implemented** — no backend integration.

## State

| State | Type | Purpose |
|-------|------|---------|
| `recipients` | `string` | Recipient type (all/role/team/custom) |
| `subject` | `string` | Email subject |
| `message` | `string` | Email body |
| `selectedRoles` | `string[]` | Selected roles for filtering |
| `selectedTeams` | `string[]` | Selected teams for filtering |
| `selectedUsers` | `string[]` | Custom user selection |
| `priority` | `string` | Email priority |
| `isCustomModalOpen` | `boolean` | CustomUserSelectionModal open |
| `isSuccessModalOpen` | `boolean` | Success confirmation modal |

## Known Issues

- Email sending is UI-only — `console.log` on submit, no API call.
- Extensive inline Hebrew.
- 333 lines — should be split.
