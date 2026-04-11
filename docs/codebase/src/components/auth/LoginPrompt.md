# LoginPrompt.tsx

**File:** `src/components/auth/LoginPrompt.tsx`
**Lines:** 58
**Status:** Active

## Purpose

Full-page unauthenticated fallback screen. Shows a lock icon, a Hebrew message explaining the page requires login, and a button that calls `AuthContext.setShowAuthModal(true)` to open the global login modal.

## Notes

- Contains inline Hebrew text not sourced from `TEXT_CONSTANTS` (lines 37–38, 52). Should be moved to `TEXT_CONSTANTS`.
- Button styling duplicates `.btn-primary` pattern — candidate to use the component class.
- `dir="rtl"` on the wrapper div — redundant (already set on `<html>`).
