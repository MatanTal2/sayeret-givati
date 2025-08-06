# 🏷️ ItemTypes Collection Documentation

## Overview

The `itemTypes` collection serves as a template repository for standard military equipment types in the Sayeret Givati equipment management system. This collection contains predefined equipment specifications that can be used when creating new equipment entries.

## Purpose

- **Standardization**: Ensures consistent equipment categorization and specifications
- **Efficiency**: Speeds up equipment registration by providing pre-filled templates
- **Data Integrity**: Maintains consistent manufacturer names, categories, and depot assignments
- **Scalability**: Allows easy addition of new equipment types as needed

## Collection Structure

### Document ID Format

- **Format**: `TEMPLATE_{CATEGORY}_{MODEL_IDENTIFIER}`
- **Examples**:
  - `TEMPLATE_RADIO_PRC-152`
  - `TEMPLATE_OPTICS_ACOG`
  - `TEMPLATE_EXTRACTION_ROPE_30M`

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Document ID (same as Firestore document ID) | `"TEMPLATE_RADIO_PRC-152"` |
| `category` | `string` | Equipment category | `"radio"` |
| `model` | `string` | Equipment model name | `"PRC-152"` |
| `manufacturer` | `string` | Manufacturer name | `"Harris"` |
| `assignmentType` | `"team" \| "personal"` | Assignment type | `"team"` |
| `defaultDepot` | `string` | Default storage depot | `"Radio Depot"` |
| `defaultStatus` | `string` | Default status for new items | `"work"` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `defaultImageUrl` | `string` | Optional default image URL |
| `createdAt` | `timestamp` | Creation timestamp (auto-generated) |
| `updatedAt` | `timestamp` | Last update timestamp (auto-generated) |

## Mock Data

The system includes three default item types:

### 1. Radio - Harris PRC-152

```json
{
  "id": "TEMPLATE_RADIO_PRC-152",
  "category": "radio",
  "model": "PRC-152",
  "manufacturer": "Harris",
  "assignmentType": "team",
  "defaultDepot": "Radio Depot",
  "defaultImageUrl": "",
  "defaultStatus": "work"
}
```

### 2. Optics - Trijicon ACOG 4x32

```json
{
  "id": "TEMPLATE_OPTICS_ACOG",
  "category": "optics", 
  "model": "ACOG 4x32",
  "manufacturer": "Trijicon",
  "assignmentType": "personal",
  "defaultDepot": "Optics Depot",
  "defaultImageUrl": "",
  "defaultStatus": "work"
}
```

### 3. Extraction Gear - Petzl Rescue Rope 30m

```json
{
  "id": "TEMPLATE_EXTRACTION_ROPE_30M",
  "category": "extraction_gear",
  "model": "Rescue Rope 30m", 
  "manufacturer": "Petzl",
  "assignmentType": "team",
  "defaultDepot": "Gear Depot",
  "defaultImageUrl": "",
  "defaultStatus": "work"
}
```

## Implementation Files

### 1. Types Definition

- **File**: `src/types/equipment.ts`
- **Contains**: `ItemType` interface, `NewItemTypeForm`, equipment categories enums

### 2. Service Layer

- **File**: `src/lib/itemTypesService.ts`
- **Contains**: `ItemTypesService` class with CRUD operations and seeding functions

### 3. Seeding Script

- **File**: `src/scripts/seedItemTypes.ts`
- **Contains**: Script to populate the collection with mock data

### 4. Admin Component

- **File**: `src/components/admin/ItemTypesSeeder.tsx`
- **Contains**: UI component for admin users to manage the collection

### 5. Configuration

- **File**: `src/constants/admin.ts`
- **Contains**: `FIRESTORE_ITEM_TYPES_COLLECTION` constant

### 6. Security Rules

- **File**: `firestore.rules`
- **Contains**: Security rules for the `itemTypes` collection

## Usage

### 1. Seeding the Collection

#### Option A: Using the Script

```bash
npx ts-node src/scripts/seedItemTypes.ts
```

#### Option B: Using the Service

```typescript
import { ItemTypesService } from '@/lib/itemTypesService';

await ItemTypesService.seedItemTypes();
```

#### Option C: Using the Admin UI

Navigate to the admin panel and use the ItemTypesSeeder component.

### 2. Reading Item Types

```typescript
import { ItemTypesService } from '@/lib/itemTypesService';

// Get all item types
const allItemTypes = await ItemTypesService.getAllItemTypes();

// Get by category
const radios = await ItemTypesService.getItemTypesByCategory('radio');

// Get by assignment type
const personalItems = await ItemTypesService.getItemTypesByAssignmentType('personal');
```

### 3. Adding New Item Types

```typescript
import { ItemTypesService } from '@/lib/itemTypesService';
import { ItemType } from '@/types/equipment';

const newItemType: ItemType = {
  id: 'TEMPLATE_WEAPON_M4A1',
  category: 'weapons',
  model: 'M4A1 Carbine',
  manufacturer: 'Colt',
  assignmentType: 'personal',
  defaultDepot: 'Armory',
  defaultStatus: 'work'
};

const result = await ItemTypesService.addItemType(newItemType);
```

## Security

### Firestore Rules

- **Read**: All authenticated users can read item types
- **Write**: Only users with `equipment_manager`, `commander`, or `admin` roles
- **Delete**: Only test documents (`TEST-*` or `DEBUG-*` prefixes) by authorized users

### Permissions Required

- **View**: Basic authenticated user
- **Manage**: `equipment_manager`, `commander`, or `admin` role

## Equipment Categories

The system supports the following predefined categories:

- `radio` - Communication radios
- `optics` - Optical equipment (scopes, binoculars)
- `extraction_gear` - Rope, harnesses, extraction equipment
- `weapons` - Small arms and weapons systems
- `protective_gear` - Body armor, helmets, protective equipment
- `communication` - Communication devices
- `navigation` - GPS, compasses, navigation tools
- `medical` - Medical supplies and equipment
- `tools` - General tools and equipment
- `general` - Miscellaneous equipment

## Testing

Run the test suite:

```bash
npm test -- src/lib/__tests__/itemTypesService.test.ts
```

The tests cover:

- Mock data validation
- Service method functionality
- Error handling
- Field validation

## Best Practices

1. **ID Naming**: Use descriptive, consistent ID patterns (`TEMPLATE_{CATEGORY}_{MODEL}`)
2. **Categories**: Use predefined categories from `EquipmentCategory` enum
3. **Manufacturers**: Use consistent manufacturer names across items
4. **Depots**: Use standardized depot names for consistency
5. **Testing**: Always test with `TEST-` prefix for development
6. **Validation**: Validate all required fields before creating items

## Future Enhancements

- **Image Support**: Add actual image URLs for equipment visualization
- **Specifications**: Add detailed technical specifications
- **Maintenance**: Add maintenance schedules and requirements
- **Costs**: Add cost information for budgeting
- **Suppliers**: Add supplier information for procurement
- **Variants**: Support for equipment variants and configurations
