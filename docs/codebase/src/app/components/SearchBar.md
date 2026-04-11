# SearchBar.tsx

**File:** `src/app/components/SearchBar.tsx`
**Lines:** 31
**Status:** Active

## Purpose

Simple controlled text input for filtering soldiers by name. Renders a search icon and an input field. Debouncing is handled by the parent (`StatusPage`).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | ✅ | Controlled input value |
| `onChange` | `(value: string) => void` | ✅ | Change handler |
| `placeholder` | `string` | ❌ | Input placeholder text |
