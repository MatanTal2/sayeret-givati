# MilitaryInfoSection.tsx

**File:** `src/components/profile/MilitaryInfoSection.tsx`
**Status:** Active

## Purpose

Renders the "Military Information" card on `/profile`. Read-only display of `rank`, `role`, `joinDate`, `status`. Editable (behind a section-level pencil toggle): `teamId`, `enlistmentCycle`.

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `user` | `EnhancedAuthUser` | Source of truth for all displayed fields |
| `onSaved` | `() => Promise<void> \| void` | Called after a successful save (page-level `refreshEnhancedUser`) |

## Edit pattern

Top-trailing pencil button switches the card into edit mode. Editable fields swap their display node for an input; read-only fields stay unchanged. Save / Cancel render at the section footer. Save calls `updateUserProfile({ teamId, enlistmentCycle })` then `onSaved()`; cancel resets the edit buffers to the source values and exits edit mode. While saving, all inputs are disabled and Save reads "שומר...".

Local edit buffers re-sync against `user.teamId` / `user.enlistmentCycle` via a `useEffect` whenever the source changes AND the card is not in edit mode — this prevents the buffer from being clobbered mid-edit if `AuthContext` re-runs.

## Field shapes

- `teamId`: free-form string (trimmed on save).
- `enlistmentCycle`: ISO `YYYY-MM` (e.g. `2010-03`). The input uses `type="month"` so the platform renders a native month/year picker. Display formats via `format(parse(value, 'yyyy-MM'), 'MMMM yyyy', { locale: he })` → `מרץ 2010`. Falsy values render as `NOT_AVAILABLE`. Malformed values fall through to the raw string rather than throwing.

## Localization

Hebrew strings live in `TEXT_CONSTANTS.PROFILE.*`. English mirrors for the new keys are in `src/constants/text.en.ts` per `feedback_bilingual_text`; the runtime still reads Hebrew only — the language toggle will wire reads through a locale-aware accessor once the i18n PR lands.
