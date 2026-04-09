# BulkUpload.tsx

**File:** `src/app/admin/components/BulkUpload.tsx`
**Lines:** 445 ⚠️ LONG — split recommended
**Status:** Active

## Purpose

CSV bulk upload for authorized personnel. Allows the admin to download a template CSV, upload a filled CSV, preview the parsed records, and then batch-write them to Firestore via `AdminFirestoreService.addAuthorizedPersonnelBulk`. Provides progress feedback and a results summary (success count, failure count, error list).

## Props

None.

## State

| State | Type | Purpose |
|-------|------|---------|
| `uploadResult` | `CsvUploadResult \| null` | Upload results summary |
| `isProcessing` | `boolean` | Batch write in progress |
| `csvPreview` | `AuthorizedPersonnelData[] \| null` | Parsed records before submission |
| `processingProgress` | `string` | Progress message text |
| `fileInputRef` | `RefObject<HTMLInputElement>` | Hidden file input ref |

## Local Types

- `CsvUploadResult` — `{ success: number; failed: number; errors: string[]; successNames: string[] }`

## Firebase Operations

| Collection | Operation | Function |
|------------|-----------|---------|
| `authorized_personnel` | `writeBatch → batch.set` | `AdminFirestoreService.addAuthorizedPersonnelBulk` |

## CSV Format

```
militaryPersonalNumber,firstName,lastName,rank,phoneNumber,userType
1234567,"מתן","טל","רס״ל","0501234567","user"
```

## Known Issues / TODO

- CSV parser does not handle quoted fields containing commas correctly (simple split on `,`).
- Name validation rejects `-` and `'` characters (known bug in `docs/bugs.md`).
