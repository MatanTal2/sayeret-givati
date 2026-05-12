# page.tsx (Logistics tool)

**File:** `src/app/tools/logistics/page.tsx`
**Status:** Active

## Purpose

Embeds the standalone `logistics.html` tool inside the unified app shell at `/tools/logistics`.

## Layout

Wrapped in `AuthGuard` + `AppShell` with `hidePageHeader` and `mainClassName="flex-1 flex flex-col min-h-0"` so the iframe fills remaining viewport height under the unified `TopBar`.

Sub-bar below `TopBar`:
- "← חזרה לכלים" link → `/tools`
- "⬇️ הורד" button → triggers download of `/tools/logistics.html` as `דרישות-מלמ.html`

Iframe loads `/tools/logistics.html` with `flex-1` to consume the remaining vertical space.

## Notes

Recent-route tracking is handled by `AppShell` via the `title` prop — no per-page `trackRouteVisit` call.
