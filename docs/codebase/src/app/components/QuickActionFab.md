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

- Fixed `bottom-5 start-5 z-50`, hidden on `lg:` and up. In RTL (the app default) `start` resolves to the visual right edge — placing the FAB under the user's right thumb (the conventional position for right-handed users regardless of text direction).
- Speed-dial children align with `items-end` so the action chips trail to the visual left away from the FAB.
- Click outside or `Escape` closes the speed-dial.
- Plus icon rotates 45° (→ X) when open.

## Dependencies

- `useToast()` from `src/components/ui/Toast.tsx` for the "coming soon" notification.
- `TEXT_CONSTANTS.QUICK_ACTIONS` for labels.
