# data/equipmentTemplates.ts

**File:** `src/data/equipmentTemplates.ts`  
**Lines:** 80  
**Status:** Active (partially deprecated)

## Purpose

Static equipment template definitions and helper functions. Originally the source of truth for templates; now templates are managed via Firestore (`equipmentTemplates` collection) through the UI.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `EquipmentTemplate` | interface | Static template shape with name, category, productName, description, idPrefix, icon, defaultLocation |
| `generateSerialNumber` | `(prefix) => string` | Generates serial number with prefix + random digits |
| `createEquipmentFromTemplate` | `(template, serialNumber, holder, unit) => Equipment` | Creates equipment object from template |

## Notes

- Template data has migrated to Firestore. These static templates may still be used as fallback or for initialization.
- `equipmentInitializer.ts` uses this file but is itself deprecated.
