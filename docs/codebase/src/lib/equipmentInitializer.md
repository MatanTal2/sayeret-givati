# equipmentInitializer.ts

**File:** `src/lib/equipmentInitializer.ts`  
**Lines:** 122  
**Status:** Deprecated

## Purpose

Equipment template seeding utility. Was used to initialize `equipmentTemplates` collection from static data. Now deprecated — templates are managed via the UI (`EquipmentTemplateForm`).

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `initializeEquipmentTypes` | `() => Promise<void>` | Seeds templates (deprecated) |
| `checkEquipmentTypesInitialized` | `() => Promise<boolean>` | Checks if templates exist |
| `getEquipmentTypeStats` | `() => Promise<Stats>` | Returns template count stats |

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|----------|
| `equipmentTemplates` | `getDocs` | `checkEquipmentTypesInitialized()`, `getEquipmentTypeStats()` |

## Notes

- Shows console warnings about deprecation.
