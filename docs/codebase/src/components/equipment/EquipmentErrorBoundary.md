# EquipmentErrorBoundary.tsx

**File:** `src/components/equipment/EquipmentErrorBoundary.tsx`  
**Lines:** 125  
**Status:** Active

## Purpose

React class-based error boundary for the equipment domain. Catches render errors in its children and shows either a custom `fallback` component or a `DefaultErrorFallback` with error details, a "Try Again" button (resets the boundary), and a "Refresh Page" button (`window.location.reload()`). Optionally calls `onError` when an error is caught.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✅ | Content to render when no error |
| `fallback` | `React.ComponentType<{ error?: Error; resetError: () => void }>` | ❌ | Custom error UI |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | ❌ | Error reporting callback |

## State

| State | Type | Purpose |
|-------|------|---------|
| `hasError` | `boolean` | Whether an error was caught |
| `error` | `Error \| undefined` | The caught error |

## Notes

- Class component (required for `getDerivedStateFromError` / `componentDidCatch`).
- `DefaultErrorFallback` shows a collapsible `<details>` with the error stack.
- Text from `TEXT_CONSTANTS.FEATURES.EQUIPMENT.*`.
- `dark:` mode classes included.
