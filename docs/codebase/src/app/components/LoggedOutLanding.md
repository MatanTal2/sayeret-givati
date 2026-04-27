# LoggedOutLanding.tsx

**File:** `src/app/components/LoggedOutLanding.tsx`
**Status:** Active

## Purpose

Public marketing/login surface rendered by `src/app/page.tsx` when `useAuth().isAuthenticated` is `false`. Replaces the dashboard entirely — no Firestore reads, no widget skeletons, no gated surface to leak errors into the console.

Separating public-landing from logged-in dashboard is the canonical "SaaS login gate" pattern (Slack, Linear, Notion, Figma).

## Layout

- Full-bleed screen, soft top-to-bottom gradient (`white → neutral-50 → primary-50/40`).
- Centered hero column: halo-backed logo, app name, subtitle, primary "Sign in" CTA, three feature teasers with tinted icon pills, minimal footer.
- Uses the existing `GlobalAuthModal` for sign-in — CTA calls `setShowAuthModal(true)` from `AuthContext`.

## Dependencies

- `useAuth()` from `src/contexts/AuthContext.tsx` — `setShowAuthModal`
- `TEXT_CONSTANTS.APP_NAME`, `APP_SUBTITLE`, `COMPANY_NAME`, `VERSION`, `BUTTONS.LOGIN`, `HOME.LANDING.*`
- `lucide-react` icons: `LogIn`, `Package`, `ShieldCheck`, `Wrench`
- `btn-primary` `@layer components` class from `src/app/globals.css`

## Notes

- Deliberately does **not** render `AppShell`. AppShell's sidebar would link to `AuthGuard`-wrapped routes that redirect anonymous users back here, creating a loop.
- `isLoading` state from `useAuth` is handled in the parent (`page.tsx`) via a minimal spinner — prevents a flash of the landing for returning authenticated users on page load.
