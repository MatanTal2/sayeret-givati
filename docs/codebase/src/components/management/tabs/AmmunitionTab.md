# AmmunitionTab

**File:** `src/components/management/tabs/AmmunitionTab.tsx`
**Status:** Active (Phase 2 — Ammunition feature)

## Purpose

Top-level "Ammunition" management tab. Hosts an inner sub-tab strip with four
sections: *Templates / Inventory / Reports / Requests*. Phase 2 ships only
`AmmunitionTemplatesSection`; the other three render a "coming next phase"
placeholder.

## Sub-sections

| Sub-tab | Component | Status |
|---------|-----------|--------|
| `templates` | `AmmunitionTemplatesSection` | Active (Phase 2) |
| `inventory` | `AmmunitionInventorySection` | Placeholder (Phase 3) |
| `reports` | `AmmunitionReportsSection` | Placeholder (Phase 5) |
| `requests` | `AmmunitionRequestsSection` | Placeholder (Phase 6) |

## Tab gating

Registered in `useManagementTabs` under the `equipment` category. Visible when
`canManageTemplates || isTeamLeader`. Phase 5 may broaden visibility for
manager-only sub-sections; per-section gating happens inside each section
component.
