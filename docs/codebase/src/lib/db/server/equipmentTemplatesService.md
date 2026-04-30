# db/server/equipmentTemplatesService.ts

**File:** `src/lib/db/server/equipmentTemplatesService.ts`
**Status:** Active

## Purpose

Admin-SDK writes for the canonical-direct creation path on
`equipmentTemplates`. The propose / approve / reject lifecycle stays
in `templateRequestService`.

## Exports

| Export | Purpose |
|---|---|
| `serverCreateEquipmentType` | Creates a new template doc. Caller decides `status` and `isActive`; the management UI writes `status: CANONICAL`, `isActive: true`. Doc shape mirrors what `serverProposeTemplate` writes (sans the propose-specific `proposedAt` / `proposedByUserId`) so list filters see both creation paths the same way. |
| `serverUpdateEquipmentType` | Patches a template. Whitelisted fields only. Low-level — no audit, no permission gate. Prefer `serverUpdateCanonicalTemplate` from API routes. |
| `serverUpdateCanonicalTemplate` | Edit a canonical template via the management UI. Wraps `serverUpdateEquipmentType` and writes a `TEMPLATE_UPDATED` actionsLog entry. Strips any `status` from the edits — lifecycle transitions still go through the propose / approve / reject flow. |
| `serverRetireCanonicalTemplate` | Soft-delete: flips `isActive: false`, leaves `status: CANONICAL` so existing `Equipment` items still resolve their template fields. The wizard's `activeOnly: true` filter then hides the template from new equipment creation. Writes a `TEMPLATE_RETIRED` actionsLog entry. Physical delete is intentionally not supported — `Equipment.equipmentTypeId` references would orphan. |

## Doc shape

Always written: `id`, `name`, `category`, `subcategory`,
`requiresDailyStatusCheck`, `requiresSerialNumber`, `isActive`,
`templateCreatorId`, `status`, `createdAt`, `updatedAt`.

Optional (written only if provided): `description`, `notes`,
`defaultCatalogNumber`.

## Why `status` + `requiresSerialNumber` are required input

Pre-bug-#14 the input shape silently dropped these two. Templates
created via the management Manage Templates tab landed in Firestore
without `status`, so the UI's client-side `status === CANONICAL` filter
excluded them and they appeared to vanish. Both fields are now part of
the input contract and the API route validates them up front.
