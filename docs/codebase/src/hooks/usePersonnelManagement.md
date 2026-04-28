# usePersonnelManagement.ts

**File:** `src/hooks/usePersonnelManagement.ts`  
**Lines:** 297  
**Status:** Active

## Purpose

Manages authorized personnel CRUD with Firestore integration and `PersonnelCache` caching. Supports add, bulk add, update, delete, and search operations.

## Return Shape

```typescript
{
  formData, isLoading, message, personnel,
  updateFormField, addPersonnel, addPersonnelBulk,
  updatePersonnel, deletePersonnel, fetchPersonnel,
  clearMessage, resetForm, cacheInfo
}
```

`addPersonnel` and `updatePersonnel` both return `Promise<PersonnelOperationResult>` so consumers can drive their own UX (e.g. `AddPersonnel`'s submit-state machine). The hook still populates the shared `message` field for any consumers that prefer that channel.

## Firebase Operations

- Via `AdminFirestoreService`: read/write/delete on `authorized_personnel` collection
- Via `PersonnelCache`: localStorage caching with 1-day TTL
