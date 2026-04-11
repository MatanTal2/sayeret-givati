# useEquipment.ts

**File:** `src/hooks/useEquipment.ts`  
**Lines:** 390 ⚠️ LONG  
**Status:** Active

## Purpose

Manages equipment items and types with Firestore CRUD. Loads on mount and reloads when auth state changes. Provides methods for creating, transferring, and updating equipment items and types.

## Return Shape

```typescript
{
  equipment[], equipmentTypes[], loading, error, typesLoading, typesError,
  refreshEquipment, refreshTypes, addEquipment, transferEquipment,
  updateEquipment, addEquipmentType,
  getEquipmentById, getByStatus, getByCondition, getByHolder, getByUnit
}
```

## Firebase Operations

- **Read:** `EquipmentService.Items.getEquipmentItems()`, `EquipmentService.Types.getEquipmentTypes()`
- **Write:** `EquipmentService.Items.createEquipmentItem()`, `.updateEquipmentItem()`, `.transferEquipment()`
- **Write:** `EquipmentService.Types.createEquipmentType()`

## Known Issues

- Reloads all data on every auth state change.
- No caching mechanism.
- 390 lines — candidate for split.
