# equipmentService.ts

**File:** `src/lib/equipmentService.ts`  
**Lines:** 724 ⚠️ LONG  
**Status:** Active

## Purpose

Core CRUD operations for equipment types (templates) and equipment items. Two main service classes: `EquipmentTypesService` for template management and `EquipmentItemsService` for individual equipment operations including transfers with Firestore transactions.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `EquipmentServiceResult` | interface | Generic result shape `{ success, error?, data? }` |
| `EquipmentListResult` | interface | Result with `items: Equipment[]` |
| `EquipmentTypeListResult` | interface | Result with `types: EquipmentType[]` |
| `EquipmentTypesService` | class (static) | Template CRUD: `createEquipmentType()`, `getEquipmentTypes()`, `getEquipmentTypeById()`, `updateEquipmentType()`, `deactivateEquipmentType()`, `batchCreateEquipmentTypes()` |
| `EquipmentItemsService` | class (static) | Item CRUD: `createEquipmentItem()`, `getEquipmentItems()`, `getEquipmentItemById()`, `updateEquipmentItem()`, `transferEquipment()`, `batchCreateEquipmentItems()` |
| `EquipmentService` | object | Namespace re-export: `{ Types: EquipmentTypesService, Items: EquipmentItemsService }` |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `equipmentTemplates` | `setDoc` | `createEquipmentType()` |
| `equipmentTemplates` | `getDoc` | `getEquipmentTypeById()` |
| `equipmentTemplates` | `getDocs`, `query` | `getEquipmentTypes()` |
| `equipmentTemplates` | `updateDoc` | `updateEquipmentType()`, `deactivateEquipmentType()` |
| `equipmentTemplates` | `writeBatch` | `batchCreateEquipmentTypes()` |
| `equipment` | `setDoc` | `createEquipmentItem()` |
| `equipment` | `getDoc` | `getEquipmentItemById()` |
| `equipment` | `getDocs`, `query` | `getEquipmentItems()` |
| `equipment` | `updateDoc` | `updateEquipmentItem()` |
| `equipment` | `runTransaction` | `transferEquipment()` |
| `actionsLog` | `addDoc` | Via `ActionLogHelpers` (indirect) |

## Notes

- 724 lines — candidate for split between types service and items service.
- `EQUIPMENT_COLLECTION` defined locally as `'equipment'` — duplicated in other files.
- `transferEquipment()` uses Firestore transaction for atomicity.
- `getEquipmentTypes()` does **not** `orderBy` on Firestore. Firestore drops every doc that lacks the order field, and `serverCreateEquipmentType` / `serverProposeTemplate` do not write `sortOrder`. Sorting happens client-side: `sortOrder` (missing → `MAX_SAFE_INTEGER`) then `name`. See `docs/bugs.md` #15 for the bug this avoids.
