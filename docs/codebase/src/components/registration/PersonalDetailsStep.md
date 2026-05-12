# PersonalDetailsStep.tsx

**File:** `src/components/registration/PersonalDetailsStep.tsx`
**Lines:** 215
**Status:** Active

## Purpose

Registration step 3 (after OTP). Collects first name, last name, gender, and birthdate. Pre-fills first/last name from the `authorized_personnel` record (passed as props). Validates in real-time using `validateHebrewName`, `validateGender`, `validateBirthdate`.

## Layout notes

All four inputs (first name, last name, gender, birthdate) share `h-10 border-2 rounded-lg px-3 text-sm` for a uniform row height across the form.

Gender (Headless UI Listbox) and birthdate (`<input type="date">`) sit side-by-side in a 2-col grid (`gap-3`). The Select uses `!`-prefixed Tailwind classes to override the `input-base` `@layer components` defaults (border-1, rounded-xl, px-4) since `cn()` is not tailwind-merge.

The date input has `dir="ltr"` + `text-left` to opt out of the page-wide RTL inheritance — Chrome's native date widget reverses segment order under RTL and wraps "DD MMM YYYY" into a broken multi-line layout. LTR keeps the segments in the user's locale order while the rest of the form remains RTL.

### Birthdate placeholder trick

Native `<input type="date">` ignores the `placeholder` attribute, so the empty field would render blank with no hint. The input uses a focus-toggle pattern: it renders as `type="text"` while `formData.birthdate` is empty so the placeholder `BIRTHDATE_PLACEHOLDER` ("בחר תאריך לידה") is visible; on focus it switches to `type="date"` so the native picker opens; on blur with an empty value it switches back to `text`. Once a value is set the type stays `date`. `aria-label={BIRTHDATE}` supplies the accessible name regardless of which type is currently rendered.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `firstName` | `string` | ✅ | Pre-filled from authorized_personnel |
| `lastName` | `string` | ✅ | Pre-filled from authorized_personnel |
| `gender` | `string` | ❌ | Initial gender value |
| `birthdate` | `string` | ❌ | Initial birthdate value |
| `onSubmit` | `(data: PersonalDetailsData) => void` | ✅ | Step completion callback |

## State

| State | Type | Purpose |
|-------|------|---------|
| `formData` | `PersonalDetailsData` | Controlled form fields |
| `validationErrors` | `PersonalDetailsValidationErrors` | Per-field error messages |
| `isFormValid` | `boolean` | Whether all fields pass validation |
