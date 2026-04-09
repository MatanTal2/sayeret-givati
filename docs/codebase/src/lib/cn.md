# cn.ts

**File:** `src/lib/cn.ts`  
**Lines:** 8  
**Status:** Active

## Purpose

CSS class name utility combining `clsx` and `tailwind-merge` for conditional and conflict-free Tailwind class names.

## Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `cn` | `(...inputs: ClassValue[]) => string` | Merges class names, resolving Tailwind conflicts |

## Notes

- This is the **only** permitted way to combine conditional class names (per CLAUDE.md).
