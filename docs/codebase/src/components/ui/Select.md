# Select.tsx

**File:** `src/components/ui/Select.tsx`
**Status:** Active

## Purpose

Custom dropdown built on Headless UI `Listbox`. Replaces native `<select>`/`<option>` everywhere a styled dropdown is needed. Native select panels are OS-rendered and cannot be styled by CSS — this component fixes width-overflow, OS focus colors, and font/border mismatches.

## Why not native `<select>`

- Browsers ignore CSS `border-radius`, `border-color`, `background`, `font-*` on `<option>`.
- Panel width sized by longest option, can overflow modal.
- Highlight color = OS theme (Windows blue), not brand.

## Why Headless UI

- Tailwind ecosystem fit, used by Tailwind UI examples.
- Built-in ARIA + keyboard navigation.
- `anchor` prop uses Floating UI to position panel; exposes `--button-width` CSS var so panel matches trigger width without manual measurement.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `T \| null` | — | Current value; `null` = unselected |
| `onChange` | `(v: T \| null) => void` | — | Selection handler |
| `options` | `SelectOption<T>[]` | — | `{ value, label, disabled? }` |
| `placeholder` | `string` | `"—"` | Trigger text + clear-row label when value is null |
| `clearable` | `boolean` | `false` | Render explicit clear row at top of panel |
| `disabled` | `boolean` | `false` | Disables trigger |
| `id` | `string` | — | Forwarded to trigger button |
| `className` | `string` | — | Forwarded to trigger button |
| `ariaLabel` | `string` | — | Forwarded to trigger button |

## Styling

- Trigger uses `input-base` (single source of truth from `globals.css`).
- Panel: `rounded-xl border border-neutral-300 bg-white shadow-medium`, `max-h-60 overflow-auto`, `z-50`.
- Hover row: `data-[focus]:bg-primary-50`.
- Selected row: `data-[selected]:bg-primary-100 data-[selected]:text-primary-700`, with `Check` icon on visual end.
- All colors are Tailwind tokens — no arbitrary values.

## RTL

`<html dir="rtl">` is global. Logical Tailwind classes (`text-start`, `ms-auto`) handle direction. Do not add `dir` to the component.

## Usage

```tsx
import { Select } from '@/components/ui';

<Select
  value={categoryId}
  onChange={(v) => setCategoryId(v)}
  options={categories.map((c) => ({ value: c.id, label: c.name }))}
  placeholder="בחירת קטגוריה"
  clearable
  ariaLabel="קטגוריה"
/>
```

For non-nullable required values omit `clearable` and pass a non-null `value`.

## Integration with `FormField`

`FormField.tsx` clones its single child and injects classes meant for native inputs. `Select` does not nest cleanly inside `FormField`. Use a plain `<label>` next to `<Select>` instead (see `EmailTab.tsx` for the pattern).

## Related

- Replaced native `<select>` across: equipment wizard, equipment template form, equipment table sort, equipment status filter, ammunition forms (template, report, inventory, reports section), management tabs (Users, Permissions, EnforceTransfer, Email, DataManagement, AuditLogs, CustomUserSelectionModal), admin personnel (Add/View/Update), registration steps, status page, settings page, AddSoldierForm.
