# constants/text.ts

**File:** `src/constants/text.ts`  
**Lines:** 1171 ⚠️ LONG  
**Status:** Active

## Purpose

Centralized Hebrew/English UI text constants for the entire application. Single source of truth for all user-facing strings.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `TEXT_CONSTANTS` | object | Nested object with all UI strings organized by domain |
| `TEXT_FMT` | object | Format functions (e.g. `HOURS_AGO(n)`, `DAYS_AGO(n)`) |

## Sections

- `APP` — app name, branding
- `NAVIGATION` — menu item labels
- `AUTH` — login, registration, OTP strings
- `FEATURES` — equipment, status page, management strings
- `BUTTONS` — common button labels
- `CONFIRMATIONS` — confirmation dialog text
- `ARIA_LABELS` — accessibility labels
- `REGISTRATION_COMPONENTS` — registration step-specific text
- `EQUIPMENT_PAGE` — equipment page-specific text
- `COMPANY_NAME` — company branding

## Known Issues

- 1171 lines — largest file in the codebase. Should be split by domain (auth, equipment, management, etc.).
- Some components still use inline Hebrew strings instead of referencing this file.
