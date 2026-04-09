# AuthGuard.tsx

**File:** `src/components/auth/AuthGuard.tsx`
**Lines:** 37
**Status:** Active

## Purpose

Route protection wrapper. While auth is loading, shows a centered spinner. If unauthenticated, renders `LoginPrompt` (or a custom `fallback`). If authenticated, renders `children`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✅ | Content to show when authenticated |
| `fallback` | `ReactNode` | ❌ | Custom unauthenticated view; defaults to `LoginPrompt` |
