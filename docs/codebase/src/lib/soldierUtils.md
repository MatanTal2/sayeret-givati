# soldierUtils.ts

**File:** `src/lib/soldierUtils.ts`  
**Lines:** 115  
**Status:** Active

## Purpose

Report generation, form validation, and file operations for the soldier status page.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `generateReport` | `(soldiers, options) => string` | Creates text report of soldier statuses |
| `validateSoldierForm` | `(data) => ValidationResult` | Validates soldier add/edit form |
| `downloadTextFile` | `(content, filename) => void` | Triggers browser file download |
| `copyToClipboard` | `(text) => Promise<boolean>` | Copies text to clipboard |
