# InfoPopover

**File:** `src/components/ui/InfoPopover.tsx`
**Status:** Active

## Purpose

Reusable `?` icon that reveals a tooltip-style bubble explaining additional context — primarily used next to disabled menu rows so the user understands why an action is unavailable. Built on Headless UI `Popover`.

## Interactions

- **Desktop:** hover opens the panel (pointermove handler triggers the button); a click toggles it open/closed. Outside-click and Escape close it.
- **Mobile / touch:** tap toggles. The hover handler is gated to `pointerType === 'mouse'`, so it's a no-op on touch.

The trigger calls `e.stopPropagation()` on click so the surrounding `MenuItem` button does not also fire (which would dispatch the disabled-action handler).

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `content` | `string` | yes | — | Text rendered inside the bubble. Caller supplies the i18n'd string from `TEXT_CONSTANTS`. |
| `ariaLabel` | `string` | no | `TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.INFO_BUBBLE_LABEL` | Accessible name for the icon button. |
| `className` | `string` | no | — | Extra classes on the trigger wrapper. |

The trigger also exposes `data-info-content={content}` for tests that need to assert the bubble's content without opening the panel (Headless UI's `Popover` anchor positioning needs `floating-ui` measurements that are flaky in jsdom).

## Styling

- Trigger: `HelpCircle` from `lucide-react` at `w-3.5 h-3.5`, neutral-500 default / neutral-700 on hover, focus-visible primary-500 ring.
- Panel: `bg-neutral-900 text-white text-xs rounded-md px-2 py-1 shadow-lg max-w-[220px]`, anchored above with `z-60` (the `Menu`/`Listbox` panel stack sits at `z-50`).

## When to use

- Next to a disabled control where the disabled-reason is non-obvious.
- For inline help on form fields where a full description doesn't justify a separate label.

For verbose copy or rich content, use a real popover/modal instead — this component caps content at 220px wide and renders plain text only.
