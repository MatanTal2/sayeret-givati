# Design System

Single source of truth for all visual design decisions in this project.

**Canonical token source:** `tailwind.config.js`  
**TypeScript token export:** `src/constants/design.ts`  
**Global CSS / component classes:** `src/app/globals.css`

---

## Color Tokens

All colors are defined in `tailwind.config.js → theme.extend.colors`.  
Use Tailwind class keys everywhere (e.g. `bg-primary-500`). For JS/TS contexts use `COLORS` from `src/constants/design.ts`.

### Primary (Brand — Purple)

| Token | Hex | Use |
|-------|-----|-----|
| `primary-50` | #f3f0ff | Hover backgrounds, light tints |
| `primary-100` | #e9e5ff | Selected state backgrounds |
| `primary-200` | #d6cfff | Disabled tints |
| `primary-300` | #b8a8ff | Decorative accents |
| `primary-400` | #9575ff | Icons on light backgrounds |
| `primary-500` | #7c3aed | **Main brand color** — wave text, focus rings |
| `primary-600` | #6d28d9 | **Primary buttons** (default state) |
| `primary-700` | #5b21b6 | Primary button hover state |
| `primary-800` | #4c1d95 | Dark accents |
| `primary-900` | #3c1a78 | Very dark accents |
| `primary-950` | #2a1065 | Near-black brand tone |

### Semantic Status Colors

| Semantic | Scale | Hex (500) | Use |
|----------|-------|-----------|-----|
| `success` | 50–900 | #22c55e | Operational status, successful actions |
| `warning` | 50–900 | #f59e0b | Attention needed, pending state |
| `danger` | 50–900 | #ef4444 | Errors, destructive actions, missing equipment |
| `info` | 50–900 | #3b82f6 | Informational badges, neutral actions |
| `secondary` | 50–900 | #64748b | Muted text, secondary UI elements |
| `neutral` | 50–950 | #737373 | Backgrounds, borders, body text |

### Color Usage Guide

| Situation | Class to use |
|-----------|-------------|
| Primary action button background | `bg-primary-600 hover:bg-primary-700` |
| Destructive action button | `bg-danger-600 hover:bg-danger-700` |
| Success badge / status chip | `bg-success-100 text-success-700` |
| Warning badge | `bg-warning-100 text-warning-700` |
| Error / danger badge | `bg-danger-100 text-danger-700` |
| Info badge | `bg-info-100 text-info-700` |
| Page background | `bg-neutral-50` |
| Card background | `bg-white` |
| Primary body text | `text-neutral-900` |
| Secondary / muted text | `text-neutral-600` |
| Placeholder text | `text-neutral-400` |
| Border | `border-neutral-200` or `border-neutral-300` |

---

## Typography

Font family: **Geist Sans** (loaded via `next/font/google` in `src/app/layout.tsx`).  
Monospace: **Geist Mono** for code-like values.

| Tailwind class | Size | Line height | Use |
|----------------|------|-------------|-----|
| `text-xs` | 12px | 16px | Labels, timestamps, footnotes |
| `text-sm` | 14px | 20px | Secondary UI text, table cells |
| `text-base` | 16px | 24px | Default body text |
| `text-lg` | 18px | 28px | Section headings, card titles |
| `text-xl` | 20px | 28px | Page sub-headings |
| `text-2xl` | 24px | 32px | Page headings |
| `text-3xl` | 30px | 36px | Feature headings |
| `text-4xl` | 36px | 40px | Hero headings |

Font weights used: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).

---

## Spacing

Standard Tailwind spacing scale applies (4px base unit: `p-1` = 4px, `p-4` = 16px).

Custom additions:

| Token | Value | Use |
|-------|-------|-----|
| `spacing-18` | 72px | Sidebar icon area |
| `spacing-88` | 352px | Sidebar expanded width |
| `spacing-128` | 512px | Max content width on small pages |

---

## Shadows

Defined in `tailwind.config.js → theme.extend.boxShadow`.

| Token | Use |
|-------|-----|
| `shadow-soft` | Default card shadow (subtle) |
| `shadow-medium` | Hovered card, modals |
| `shadow-strong` | Dropdowns, popovers |
| `shadow-primary` | Active state on primary-colored elements |
| `shadow-primary-lg` | Large primary UI focus or lift |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-xl` | 12px | Buttons, inputs, small cards |
| `rounded-2xl` | 16px | Cards, modals |
| `rounded-3xl` | 24px | Large panels, hero sections |
| `rounded-full` | 9999px | Badges, avatars, pill chips |

---

## Animations

Defined in `tailwind.config.js → theme.extend.animation` and `keyframes`.  
Raw timing values are also in `ANIMATIONS` from `src/constants/design.ts`.

| Class | Duration | Use |
|-------|----------|-----|
| `animate-fade-in` | 0.3s ease-out | Page sections, modals appearing |
| `modal-enter` | 0.2s ease-out | Modal dialog entrance |
| `backdrop-enter` | 0.2s ease-out | Backdrop blur appearance |
| `pulse-slow` | 3s infinite | Status indicators pulsing |
| `wave-text` | linked to `wave-slide` | Homepage title brand animation |
| `shimmer` | 2s infinite | Loading skeleton placeholders |
| `feature-card-hover` | 0.3s cubic-bezier | Feature card lift on hover |

---

## Component Classes (`@layer components`)

Defined in `src/app/globals.css`. These are the **only** permitted way to apply repeated multi-class patterns. Do not duplicate the pattern via `cn()` across components — use the class name.

| Class | Description |
|-------|-------------|
| `.btn-primary` | Purple filled button — primary actions |
| `.btn-secondary` | Ghost text button in primary color |
| `.btn-ghost` | Neutral ghost button |
| `.btn-danger` | Red filled button — destructive actions |
| `.card-base` | White card with soft shadow and light border |
| `.card-interactive` | `card-base` + hover lift transition |
| `.input-base` | Standard form text input |
| `.badge-base` | Pill badge base (add color classes on top) |
| `.modal-overlay` | Fixed full-screen backdrop with blur |
| `.focus-ring` | Focus-visible ring in brand color |
| `.scrollbar-none` | Hide scrollbar cross-browser |
| `.wave-text` | Animated brand gradient text |
| `.shimmer` | Loading shimmer container |
| `.modal-enter` | Modal entrance animation |
| `.backdrop-enter` | Backdrop entrance animation |
| `.feature-card-hover` | Feature card hover lift |

---

## RTL Rules

- `dir="rtl"` is set **once** on `<html>` in `src/app/layout.tsx`. Never add it to individual components.
- For new layout code prefer Tailwind logical properties: `ps-` / `pe-` (padding-start/end), `ms-` / `me-` (margin-start/end) instead of `pl-`/`pr-`/`ml-`/`mr-`.
- Physical directional classes (`left-*`, `right-*`) are acceptable for elements with known RTL overrides already defined.

---

## Forbidden Patterns

These patterns are prohibited. Use the alternatives listed.

| ❌ Forbidden | ✅ Use instead |
|---|---|
| `bg-[#7c3aed]` arbitrary hex | `bg-primary-500` |
| `style={{ color: '#7c3aed' }}` | `className="text-primary-500"` |
| Inline orange / any color not in token system | Add token to `tailwind.config.js` first |
| Copy-pasting `px-6 py-3 bg-primary-600 text-white ...` in multiple files | `.btn-primary` |
| Hardcoded hex in `globals.css` | Use `var(--color-primary-*)` CSS variables |
| Direct hex import in Framer Motion / JS | Import from `src/constants/design.ts` |
| `dir="rtl"` on individual components | Set once on `<html>` in layout |
