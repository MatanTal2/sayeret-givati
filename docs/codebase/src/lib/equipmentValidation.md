# equipmentValidation.ts

**File:** `src/lib/equipmentValidation.ts`  
**Lines:** 417 ⚠️ LONG  
**Status:** Active

## Purpose

Comprehensive validation for equipment forms and individual fields. Validates serial numbers, user names, phone numbers, units, locations, notes, and complete form submissions.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `ValidationResult` | interface | `{ isValid, errorMessage }` |
| `validateNewEquipmentForm` | `(data) => Record<string, string>` | Validates full creation form |
| `validateTransferForm` | `(data) => Record<string, string>` | Validates transfer form |
| `validateBulkTransferForm` | `(data) => Record<string, string>` | Validates bulk transfer |
| `validateEquipmentId` | `(id) => ValidationResult` | Serial number validation |
| `validateUserName` | `(name) => ValidationResult` | User name validation |
| `validatePhoneNumber` | `(phone) => ValidationResult` | Phone number validation |
| `validateUnitName` | `(unit) => ValidationResult` | Unit name validation |
| `validateLocation` | `(location) => ValidationResult` | Location validation |
| `validateNotes` | `(notes) => ValidationResult` | Notes validation |
| `validateRetirementReason` | `(reason) => ValidationResult` | Retirement reason validation |
| `validateForm` | `(rules) => Record<string, string>` | Generic form validation runner |

## Notes

- 417 lines — could be split by validation domain.
- Pure functions, no side effects.
