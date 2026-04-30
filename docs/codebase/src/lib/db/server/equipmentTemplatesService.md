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
| `serverUpdateEquipmentType` | Patches a template. Whitelisted fields only. |

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
