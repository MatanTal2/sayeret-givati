# QuickActionFab.tsx

**File:** `src/app/components/QuickActionFab.tsx`
**Status:** Active

## Purpose

Mobile-only floating action button (speed-dial pattern). Tapping the FAB expands a stack of labeled action buttons above it.

Current actions (all stubbed — show a "coming soon" toast via `useToast`):

1. דיווח פריט תקול (Report damaged item)
2. דיווח שימוש בתחמושת (Report ammo used)
3. דיווח כללי (General report)

When real flows are implemented, wire each action to its own modal or route.

## Behavior

- Fixed `bottom-5 end-5 z-50`, hidden on `lg:` and up.
- Click outside or `Escape` closes the speed-dial.
- Plus icon rotates 45° (→ X) when open.

## Dependencies

- `useToast()` from `src/components/ui/Toast.tsx` for the "coming soon" notification.
- `TEXT_CONSTANTS.QUICK_ACTIONS` for labels.
