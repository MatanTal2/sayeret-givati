# TextInputWithError.tsx

**File:** `src/app/components/TextInputWithError.tsx`
**Lines:** 45
**Status:** Active

## Purpose

Labeled text input with an inline error message below. A thin wrapper around `<input>` that adds consistent label/error styling. Used in the add-soldier form and other status-page forms.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | ✅ | Input label text |
| `value` | `string` | ✅ | Controlled value |
| `onChange` | `(value: string) => void` | ✅ | Change handler |
| `error` | `string` | ❌ | Error message to show below input |
| `placeholder` | `string` | ❌ | Input placeholder |
| `type` | `string` | ❌ | Input type (default: `"text"`) |
