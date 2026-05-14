# page.tsx (Guard Scheduler tool)

**File:** `src/app/tools/guard-scheduler/page.tsx`
**Status:** Active

## Purpose

Embeds the standalone `guard-scheduler.html` tool inside the unified app shell at `/tools/guard-scheduler`. Offline-capable companion to the cloud-backed `/guard-scheduler` route.

## Layout

Wrapped in `AuthGuard` + `AppShell` with `hidePageHeader` and `mainClassName="flex-1 flex flex-col min-h-0"` so the iframe fills remaining viewport height under the unified `TopBar`.

Sub-bar below `TopBar`:
- "← חזרה לכלים" link → `/tools`
- "⬇️ הורד" button → triggers download of `/tools/guard-scheduler.html` as `מחולל-שמירות.html`

Iframe loads `/tools/guard-scheduler.html` with `flex-1` to consume the remaining vertical space.

## Relationship to other routes

- `/guard-scheduler` — full React app with Firestore-backed shareable schedules.
- `/tools/guard-scheduler` — offline embedded copy, no network/auth dependency beyond the AuthGuard wrapper. Saves up to 5 lists in `localStorage`. Author attribution footer (mamash17@gmail.com) is part of the HTML.

Parity between the two algorithms is enforced by `src/lib/__tests__/guardScheduleOfflineParity.test.ts`.
