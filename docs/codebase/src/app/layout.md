# layout.tsx (Root Layout)

**File:** `src/app/layout.tsx`
**Lines:** 42
**Status:** Active

## Purpose

Root Next.js App Router layout. Sets up the HTML document with Hebrew RTL direction, loads Geist fonts, wraps all pages in `AuthProvider` and `NotificationProvider`, and renders the `GlobalAuthModal` which floats above all page content.

## Exports / Public API

- `metadata` — Next.js metadata export: title "מסייעת סיירת גבעתי", description in Hebrew.
- `default RootLayout` — accepts `children: ReactNode`.

## Notes

- `<html lang="he" dir="rtl">` — RTL is set at the HTML level here. No component should add `dir="rtl"` redundantly.
- `suppressHydrationWarning={true}` on `<html>` — suppresses hydration mismatch warnings common with SSR + RTL.
- Provider order: `AuthProvider` wraps `NotificationProvider` because notifications need auth context.
