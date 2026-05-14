# NotificationToggleRow.tsx

**File:** `src/components/settings/NotificationToggleRow.tsx`
**Status:** Active

## Purpose

Single row in Settings → Notifications. Renders an icon, title, description, and an `aria-checked` switch button. Persistence is the parent's responsibility — this component is presentational and stateless aside from rendering the props.

## Props

| Prop | Type | Notes |
|---|---|---|
| `icon` | `ReactNode` | Decorative leading icon. |
| `title` | `string` | Row label (also used as `aria-label` on the switch for screen readers). |
| `description` | `string` | Secondary text. |
| `enabled` | `boolean` | Drives both the visual on/off state and `aria-checked`. |
| `saving` | `boolean` | When true, disables the button and applies `cursor-wait opacity-60`. |
| `onToggle` | `() => void` | Fired on click. Parent owns optimistic update + rollback. |

## A11y

- `role="switch"` + `aria-checked` so screen readers announce the toggle state.
- `aria-label={title}` so the switch is named even though the visible label sits in a sibling div.
- Disabled while `saving` to prevent double-submit.

## Caller

Currently only `src/app/settings/page.tsx` uses it (2 rows: email notifications, equipment transfer alerts). The other three `communicationPreferences` keys (`systemUpdates`, `schedulingAlerts`, `emergencyNotifications`) are defined in the type and validated server-side but have no UI yet — add a row here when product asks for them.
