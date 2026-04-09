# HamburgerMenu.tsx

**File:** `src/components/ui/HamburgerMenu.tsx`  
**Lines:** 141  
**Status:** Active

## Purpose

Animated hamburger menu with slide-in sidebar overlay and backdrop. Renders a list of navigation items with icons. Handles body scroll lock when open.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `menuItems` | `{ label, href, icon }[]` | ✅ | Navigation items |
| `onNavigate` | `(href: string) => void` | ❌ | Custom navigation handler |
| `className` | `string` | ❌ | Button wrapper classes |
| `buttonClassName` | `string` | ❌ | Button element classes |
| `menuClassName` | `string` | ❌ | Menu panel classes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `isOpen` | `boolean` | Menu visibility |

## Known Issues

- Inline Hebrew text.
- Debug `console.log` statements.
