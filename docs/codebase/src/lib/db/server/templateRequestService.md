# db/server/templateRequestService.ts

**File:** `src/lib/db/server/templateRequestService.ts`
**Status:** Active (Phase 4)

## Purpose

Admin-SDK writes for non-canonical `equipmentTemplates` lifecycle. Canonical creation stays in `equipmentTemplatesService`.

## Exports

| Export | Purpose |
|--------|---------|
| `serverProposeTemplate` | Creates template doc. Status by proposer userType: USER → `pending_request`; TEAM_LEADER / MANAGER → `proposed`; ADMIN / SYSTEM_MANAGER → `canonical` + `isActive=true` + self as reviewer (auto-approved, no manager notification). Optional `draftPayload` atomically creates an `equipmentDrafts` doc linked via `templateRequestId`. Returns `{ templateId, draftId?, status }`. |
| `serverApproveTemplateRequest` | Flips template to `canonical` + `isActive=true`, applies optional `edits`. Promotes linked drafts (calls `serverPromoteDraftsForTemplate`) and notifies owners. Logs `TEMPLATE_APPROVED`. |
| `serverRejectTemplateRequest` | Sets status=`rejected`, `isActive=false`, `rejectedReason`. Notifies proposer. Logs `TEMPLATE_REJECTED`. |

## Firebase Operations

- `equipmentTemplates` — `set`, `get`, `update`
- `equipmentDrafts` — batched create (with template) / update (promote)
- `users` — `query(userType in managers)` for notification fanout
- `actionsLog`, `notifications` — post-write

## Notes

- Request-state templates have `isActive=false` — regular users' template lookups must filter to `status='canonical'`.
