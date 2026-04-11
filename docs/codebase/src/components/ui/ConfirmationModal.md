# ConfirmationModal.tsx

**File:** `src/components/ui/ConfirmationModal.tsx`  
**Lines:** 182  
**Status:** Active

## Purpose

Reusable confirmation/info dialog with variant-based styling (`danger`, `warning`, `info`, `success`), custom icon, optional additional info section, single-button mode, and a special `useHomePageStyle` layout. Used across the app for confirmations and policy display.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | ✅ | — | Modal visibility |
| `title` | `string` | ✅ | — | Modal title |
| `message` | `string` | ✅ | — | Modal message |
| `confirmText` | `string` | ✅ | — | Confirm button label |
| `cancelText` | `string` | ✅ | — | Cancel button label |
| `onConfirm` | `() => void` | ✅ | — | Confirm handler |
| `onCancel` | `() => void` | ✅ | — | Cancel handler |
| `isLoading` | `boolean` | ❌ | `false` | Loading state on confirm |
| `variant` | `'danger' \| 'warning' \| 'info' \| 'success'` | ❌ | `'danger'` | Color scheme |
| `icon` | `string` | ❌ | — | Custom emoji icon |
| `additionalInfo` | `string` | ❌ | — | Extra info below message |
| `singleButton` | `boolean` | ❌ | `false` | Hide cancel button |
| `useHomePageStyle` | `boolean` | ❌ | `false` | Alternative layout style |

## Known Issues

- Inline Hebrew text.
