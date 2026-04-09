# AddEquipmentModal.tsx

**File:** `src/components/equipment/AddEquipmentModal.tsx`  
**Lines:** 998 ⚠️ LONG  
**Status:** Active

## Purpose

Full-featured modal for creating new equipment items. Two flows: (1) select from existing templates (categories organized in collapsible groups) or (2) create a custom template inline via `EquipmentTemplateForm`. Once a template is selected, displays a form for serial number, holder (searchable dropdown from `useUsers`), unit (searchable dropdown), location, status, condition, notes, and a "classified equipment" checkbox. Validates all fields and submits an `Equipment` object (minus server-generated fields).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `onSubmit` | `(equipment: Omit<Equipment, 'createdAt' \| 'updatedAt' \| 'trackingHistory'>) => Promise<void>` | ✅ | Submit handler |
| `loading` | `boolean` | ❌ | External loading state |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `FormData` | All form fields |
| `errors` | `Record<string, string>` | Per-field validation errors |
| `isSubmitting` | `boolean` | Submit in progress |
| `selectedTemplate` | `EquipmentTemplate \| null` | Currently selected template |
| `isClassifiedEquipment` | `boolean` | "Classified" checkbox (צלם/צופן) |
| `showTemplates` | `boolean` | Show template selection panel |
| `showCreateTemplate` | `boolean` | Show inline `EquipmentTemplateForm` |
| `showNameDropdown` | `boolean` | Holder name searchable dropdown open |
| `showUnitDropdown` | `boolean` | Unit searchable dropdown open |
| `nameSearchTerm` | `string` | Holder name search query |
| `unitSearchTerm` | `string` | Unit search query |
| `expandedCategories` | `Set<string>` | Template categories currently expanded |

## Internal Components

- `SearchableDropdown` — reusable dropdown with search input, loading state, and option list. Defined inline (not exported).

## Key Functions

| Function | Purpose |
|----------|---------|
| `getTemplateDisplayProps(template)` | Normalizes between old `EquipmentTemplate` format and new `EquipmentType` Firestore format |

## Dependencies

- `useTemplates()` — loads equipment templates from Firestore
- `useAuth()` — current user context
- `useUsers()` — user list for holder dropdown
- `validateEquipmentId`, `validateUserName`, `validateUnitName`, `validateLocation` from `equipmentValidation`

## Known Issues / TODO

- 998 lines — largest component in the codebase. Should be split: template selector, form fields, and SearchableDropdown.
- `SearchableDropdown` is defined inline — should be extracted to `src/components/ui/` for reuse.
- Inline Hebrew strings: `'טוען...'`, `'לא נמצאו תוצאות'` — should be in `TEXT_CONSTANTS`.
- Dual template format handling (`EquipmentTemplate` vs `EquipmentType`) indicates migration in progress.
