# GlobalAuthModal.tsx

**File:** `src/components/auth/GlobalAuthModal.tsx`
**Lines:** 28
**Status:** Active

## Purpose

Thin bridge between `AuthContext.showAuthModal` (global trigger) and `AuthModal`. Rendered once in `RootLayout`. When `showAuthModal` is true, opens the modal. On registration success, closes the modal and reloads the page to pick up fresh user data.

## Notes

- Uses `window.location.reload()` after registration success (100ms delay). This is a workaround — ideally `AuthContext` should refresh the user without a full reload.
- `console.log` on registration success — remove for production.
