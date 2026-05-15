# LoginModal.tsx

**File:** `src/components/auth/LoginModal.tsx`
**Lines:** 272
**Status:** Active

## Purpose

Email/password login modal. Renders a form inside an overlay. On submission calls `AuthContext.login`. Displays feedback via `AuthContext.message`. Has a "switch to registration" link that calls `onSwitch`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Whether the modal is visible |
| `onClose` | `() => void` | ✅ | Close callback |
| `onSwitch` | `() => void` | ✅ | Switch to registration modal |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `{ email, password }` | Controlled form inputs |
| `showPassword` | `boolean` | Password show/hide toggle |

## RTL layout

Both input fields use `ps-4 pe-{11|12}` (logical padding) with the icon container at `absolute end-3`. The icon sits on the logical end side (visually LEFT in `dir="rtl"`); text and placeholder default to logical start (visually RIGHT). The previous `text-end` + symmetric `px-4` produced an overlap — placeholder hint and icon both landed on the LEFT — which is what the RTL audit caught after the Hebrew flip; do not re-introduce `text-end` here.
