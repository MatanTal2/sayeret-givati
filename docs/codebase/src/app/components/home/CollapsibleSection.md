# CollapsibleSection.tsx

**File:** `src/app/components/home/CollapsibleSection.tsx`
**Status:** Active

## Purpose

Shared card container for home-page widgets. Renders a `card-base` panel with a consistent header (icon + title + optional action + chevron) and an animated collapsible body. Centralizes the wrapper pattern every widget previously rolled on its own.

Used by: `AnnouncementsWidget`, `MediaWidget`, `RecentRoutesWidget`, `LinksWidget`, plus the features grid on `src/app/page.tsx`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | ✅ | Stable identifier used as the `localStorage` key suffix |
| `title` | `string` | ✅ | Section heading |
| `icon` | `ReactNode` | — | Lucide icon rendered on the start side of the heading |
| `headerAction` | `ReactNode` | — | Element rendered between the title and the chevron — e.g. a "New announcement" button |
| `defaultCollapsed` | `boolean` | — | Initial collapsed state if no stored value exists (default `false`) |
| `children` | `ReactNode` | ✅ | Body content |
| `className` | `string` | — | Additional classes on the outer section |

## Behavior

- Collapsed state persisted in `localStorage` under key `widget_collapsed_<id>`
- Body expand/collapse animated via Framer Motion (height + opacity, 200ms ease-out)
- Accessible: `aria-expanded` on the toggle button, `aria-controls` linked to the body's `id`, body has `role="region"`
- Chevron rotates -90° when collapsed (RTL-appropriate "next" direction)

## Typical usage

```tsx
<CollapsibleSection
  id="announcements"
  title="הודעות היחידה"
  icon={<Megaphone className="w-4 h-4" />}
  headerAction={mayPost ? <NewButton /> : undefined}
>
  <AnnouncementList />
</CollapsibleSection>
```
