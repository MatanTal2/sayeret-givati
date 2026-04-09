# FeatureCard.tsx

**File:** `src/app/components/FeatureCard.tsx`
**Lines:** 43
**Status:** Active

## Purpose

Feature showcase card used on the home page grid. Renders an icon, title, description, and a clickable link. Shows an "available" or "coming soon" badge. Uses `feature-card-hover` animation class for lift on hover.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ | Feature name |
| `description` | `string` | ✅ | Short description |
| `icon` | `ReactNode` | ✅ | Icon element |
| `href` | `string` | ✅ | Navigation link |
| `available` | `boolean` | ✅ | Whether feature is live |
| `color` | `string` | ✅ | Tailwind color class for the card accent |
