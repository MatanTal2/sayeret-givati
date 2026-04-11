# FormField.tsx

**File:** `src/components/ui/FormField.tsx`  
**Lines:** 70  
**Status:** Active

## Purpose

Form field wrapper that renders a label, required indicator, children (the input), and an error message.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | ✅ | — | Field label text |
| `children` | `ReactNode` | ✅ | — | Input element |
| `error` | `string` | ❌ | — | Error message |
| `required` | `boolean` | ❌ | `false` | Show required indicator |
| `className` | `string` | ❌ | — | Wrapper classes |
| `id` | `string` | ❌ | — | HTML for/id association |
