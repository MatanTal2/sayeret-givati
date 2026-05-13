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

## Phone gating

Phone is rendered as plain LTR text outside edit mode. The full `<PhoneNumberUpdate>` sub-component (its own Update button + OTP-style ceremony) only mounts when the section is in edit mode. Rationale: phone is an identity anchor and requires its own re-verification ceremony (the real Firebase `updatePhoneNumber` flow lands in queued Settings PR-C). Folding it into the section Save would create a silent footgun once Settings PR-A (security hotfix) removes `phoneNumber` from `PROFILE_WRITABLE_FIELDS` — the API would silently no-op the phone change. Keeping the sub-flow separate preserves the seam PR-C will land on. See `project_settings_page.md` for the full chain. The section Save/Cancel buttons only persist `address`; phone has its own commit path.

## Field shape

- `address`: free-form string (trimmed on save). No validation; intentionally permissive for international / mixed-format addresses. Used downstream by Phone Book Phase 2 categorization (`project_phone_book`) when that lands.

## Localization

See `MilitaryInfoSection` docs.
