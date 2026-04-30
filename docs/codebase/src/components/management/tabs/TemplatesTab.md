# `src/components/management/tabs/TemplatesTab.tsx`

Manager review surface for equipment templates. Phase 5 deliverable. Replaces the old mock `TemplateManagementTab`.

## Three sub-lists

| Section | Source | Filter |
|---|---|---|
| Canonical templates | `EquipmentTypesService.getTemplates` | `status === CANONICAL` |
| TL proposals | same fetch | `status === PROPOSED` |
| User requests | same fetch | `status === PENDING_REQUEST` |

A single fetch returns all templates and the component bins them client-side. Re-fetched after each mutation.

## Actions

| Actor | Action | Service call |
|---|---|---|
| Manager+ | Create canonical | `EquipmentTypesService.createEquipmentType` |
| Manager+ | Edit + approve a proposed/pending row | `approveTemplateRequest` (edits merged on the server) |
| Manager+ | Reject (with optional reason) | `rejectTemplateRequest` |
| Team Leader | Propose new template | `proposeTemplate` (server sets `PROPOSED`) |

The TL "Propose" button is rendered but is only reachable once TL gains `hasManagementAccess`. Phase 5 ships the button without expanding TL access; the primary TL entry point in Phase 6 is the `/equipment` AddWizard "didn't find?" link.

## Permission gates

- Page-level: `useManagementAccess.canAccessManagement` (manager/officer/commander/admin).
- Tab visibility: `useManagementTabs` allows tab when `canManageTemplates || isTeamLeader`.
- Action buttons: gated inline by `userType === ADMIN | SYSTEM_MANAGER | MANAGER` (review/reject/canonical-create) or `userType === TEAM_LEADER` (propose).

## Category / subcategory rendering

`EquipmentType.category` and `EquipmentType.subcategory` are doc IDs.
The component uses `useCategoryLookup` to resolve them to Hebrew names
for display. Unresolved IDs are rendered raw with `text-warning-700`
styling so orphan refs are visible rather than silent.

## UI primitives

Custom modal wrapper (no shared `Modal` component yet). Toast is local to the component (auto-dismiss after 4s) — replace with the shared toast system once it lands.
