# ProfileImageUpload.tsx

**File:** `src/components/profile/ProfileImageUpload.tsx`  
**Lines:** 214  
**Status:** Active (mock upload)

## Purpose

Profile image selection and upload with file validation (type, size), preview, and configurable display sizes (small/medium/large). Shows upload progress and error/success states. Currently uses a **mock upload** — no real storage service integration.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentImageUrl` | `string` | ❌ | — | Current profile image URL |
| `onImageUpdate` | `(url: string) => void` | ✅ | — | Called with new image URL after upload |
| `size` | `'small' \| 'medium' \| 'large'` | ❌ | `'medium'` | Display size |
| `className` | `string` | ❌ | — | Additional classes |

## State

| State | Type | Purpose |
|-------|------|---------|
| `uploadState` | `{ isUploading, error, success }` | Upload progress tracking |

## Known Issues / TODO

- Mock image upload — needs Firebase Storage or equivalent.
- Inline Hebrew text.
