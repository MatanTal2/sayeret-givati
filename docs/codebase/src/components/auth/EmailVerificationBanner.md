# EmailVerificationBanner.tsx

**File:** `src/components/auth/EmailVerificationBanner.tsx`
**Status:** Active

## Purpose

Sticky top-of-page banner shown to any signed-in user whose `emailVerified` is `false`. Encourages email verification (required for password reset) without blocking app usage.

## Behavior

- Hidden when there is no signed-in user, or `emailVerified !== false` (so it does not flash for users still loading).
- "שלח קישור אימות מחדש" button calls `useAuth().resendVerificationEmail()` → `sendEmailVerification` on the current user.
- "בדוק שוב" button calls `useAuth().refreshEmailVerified()` → `auth.currentUser.reload()` then re-derives `emailVerified` into `enhancedUser`.
- Mounted once in `src/app/layout.tsx` above `{children}` so it renders on every page.
