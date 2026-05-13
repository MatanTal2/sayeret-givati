# ContactInfoSection.tsx

**File:** `src/components/profile/ContactInfoSection.tsx`
**Status:** Active

## Purpose

Renders the "Contact Information" card on `/profile`. Email is read-only. Phone is delegated to the existing `<PhoneNumberUpdate>` sub-component (its own internal flow — out of scope for the section-edit pencil). Address is editable behind the section-level pencil toggle.

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `user` | `EnhancedAuthUser` | Source of truth |
| `authEmail` | `string \| undefined` | Fallback when `user.email` is missing (early hydration) |
| `phoneNumber` | `string` | Passed through to `<PhoneNumberUpdate>` |
| `onPhoneUpdate` | `(newPhone: string) => Promise<void> \| void` | Forwarded to `<PhoneNumberUpdate>` |
| `onSaved` | `() => Promise<void> \| void` | Called after a successful address save |

## Edit pattern

Identical to `MilitaryInfoSection`: pencil toggle → input swap → footer Save/Cancel → `updateUserProfile({ address })` → `onSaved()`. The address buffer rehydrates from `user.address` via `useEffect` when not editing.

The phone update flow is NOT gated by the pencil — `<PhoneNumberUpdate>` has its own confirmation UI and remains independently usable whether or not the section is in edit mode.

## Field shape

- `address`: free-form string (trimmed on save). No validation; intentionally permissive for international / mixed-format addresses. Used downstream by Phone Book Phase 2 categorization (`project_phone_book`) when that lands.

## Localization

See `MilitaryInfoSection` docs.
