# lib/ammunition/csvExport.ts

**File:** `src/lib/ammunition/csvExport.ts`
**Status:** Active (Phase 5 — Ammunition feature)

## Purpose

Serialize a list of `AmmunitionReport`s to a Hebrew CSV that opens correctly
in Excel. Output is **BOM-prefixed UTF-8** and uses CRLF line endings.

## Exports

| Export | Purpose |
|--------|---------|
| `reportsToCsv(reports, templates)` | Returns the full CSV string. Cells with `,`, `"`, or newline are quoted; embedded quotes are doubled. |
| `downloadReportsCsv(reports, templates, filename?)` | Builds a `Blob` and triggers a download. Browser-only. |

## Columns

`תאריך שימוש`, `תאריך דיווח`, `מדווח`, `צוות`, `פריט`, `תת-קטגוריה`,
`אבטחה`, `מצב מעקב`, `כמות שנצרכה`, `סיבה`. The `כמות שנצרכה` column is
formatted per tracking mode (BRUCE shows ברוסים+קרטג׳ים+כדורים, LOOSE_COUNT
shows יח׳, SERIAL shows comma-joined serials).
