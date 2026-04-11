# Button.tsx

**File:** `src/components/ui/Button.tsx`  
**Lines:** 73  
**Status:** Active

## Purpose

Reusable button component with variants (`primary`, `secondary`, `danger`, `ghost`), sizes (`sm`, `md`, `lg`), optional icon with position control, and loading spinner state. Extends native `ButtonHTMLAttributes`.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | ❌ | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | ❌ | `'md'` | Button size |
| `icon` | `ReactNode` | ❌ | — | Icon element |
| `iconPosition` | `'left' \| 'right'` | ❌ | `'left'` | Icon placement |
| `isLoading` | `boolean` | ❌ | `false` | Show spinner, disable button |
| `children` | `ReactNode` | ❌ | — | Button label |
| `...rest` | `ButtonHTMLAttributes` | — | — | Native button attrs |
