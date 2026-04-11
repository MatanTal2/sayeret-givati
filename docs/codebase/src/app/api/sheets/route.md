# route.ts (sheets)

**File:** `src/app/api/sheets/route.ts`
**Lines:** 362 ⚠️ LONG — split recommended
**Status:** Active (GET works; POST currently affected by service account infra blocker)

## Purpose

API route for Google Sheets integration. `GET` fetches all soldiers from the Google Sheet and returns them as a JSON array. `POST` submits status updates back to the sheet (password-protected). Used exclusively by the soldier status feature (`/status`).

**Active infra blocker:** The `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable decodes to project `sayeret-givati` but the app targets `sayeret-givati-1983` — authentication will fail until a new service account key is generated.

## Exports / Public API

- `GET()` — Fetches soldier data from Google Sheets. Returns `{ soldiers: Soldier[] }`.
- `POST(request: NextRequest)` — Submits status updates. Accepts `{ soldiers, password }`. Password is hardcoded in the route (not env-configurable).

## Request / Response (POST)

```json
Request:  { "soldiers": [...], "password": "..." }
Response: { "success": true } | { "error": "..." }
```

## Notes

- Service account credentials can be provided as raw JSON string or base64-encoded — the route tries both.
- Column mapping and status translation (`mapStructuredStatusToRaw`) are hardcoded to the sheet's column layout.
- Password for update is hardcoded in this file — should move to an environment variable.
- At 362 lines, candidates for extraction: credential parsing helper, column mapping constants, status update builder.
- Extensive `console.log` calls throughout — remove for production.
