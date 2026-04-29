# useScrollLock.ts

**File:** `src/hooks/useScrollLock.ts`
**Status:** Active

## Purpose

Locks `document.body` scrolling while a modal or drawer is active. Sets `body.style.overflow = 'hidden'` on activation and restores the previous value on cleanup.

## Usage

```ts
import { useScrollLock } from '@/hooks/useScrollLock';

useScrollLock(isOpen);
```

Pass `true` to lock unconditionally (e.g. inside a modal that only mounts when shown), or a boolean tied to open-state for drawers that mount in both states.

## Where it's used

- `src/components/onboarding/WelcomeModal.tsx` — locks while the mandatory team-selection modal is shown.
- `src/components/management/sidebar/ManagementSidebar.tsx` — locks only on mobile (`max-width: 1023px`); on `lg+` the sidebar is in document flow and does not require scroll containment.
