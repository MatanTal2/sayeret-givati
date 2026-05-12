# SoldiersTableMobile.tsx

**File:** `src/app/components/SoldiersTableMobile.tsx`
**Lines:** 267
**Status:** Active

## Purpose

Mobile-optimized card list for the soldier status page. Same data and callbacks as `SoldiersTableDesktop` but renders each soldier as a card instead of a table row. Shown on `md:hidden` breakpoint.

A 2px registration dot renders before the name (green when `soldier.isRegistered`, neutral otherwise) — same `TEXT_CONSTANTS.STATUS_PAGE.REGISTERED_TOOLTIP` / `UNREGISTERED_TOOLTIP` strings as desktop.

## Props

Same interface as `SoldiersTableDesktop.tsx` — identical prop contract, different visual layout.
