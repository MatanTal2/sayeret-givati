# ProfileImageUpload.tsx

**File:** `src/components/profile/ProfileImageUpload.tsx`
**Lines:** 198
**Status:** Active (Firebase Storage)

## Purpose

Profile image selection and upload with file validation (type, size), preview, and configurable display sizes (small/medium/large). Uploads to Firebase Storage at `users/{userId}/profile/{timestamp}.{ext}` and returns the public download URL via `onImageUpdate`.

## Storage path & rules

- Path: `users/{userId}/profile/{timestamp}.{ext}` — one new object per upload, never overwrites prior images.
- Rules: `firebase/storage.rules` — owner-only write (`request.auth.uid == userId`), authenticated read, 10 MB cap, image/* content type only.
- Persisted to Firestore by the parent via `updateUserProfile(uid, { profileImage: downloadUrl })` (existing whitelist already covers `profileImage`).

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `userId` | `string` | yes | — | Firebase Auth uid; used to build the Storage path |
| `currentImageUrl` | `string` | no | — | Current profile image URL |
| `onImageUpdate` | `(url: string) => void` | yes | — | Called with the Storage download URL after upload |
| `size` | `'small' \| 'medium' \| 'large'` | no | `'medium'` | Display size |
| `className` | `string` | no | — | Additional classes |
| `showInstructions` | `boolean` | no | `true` | Render the "click to upload" hint text below the avatar; pass `false` when embedding in a header to keep alignment compact |

## State

| State | Type | Purpose |
|-------|------|---------|
| `uploadState` | `{ isUploading, error, success }` | Upload progress tracking |

## Notes

- Inline Hebrew text — should move to `TEXT_CONSTANTS` next time the file is touched.
- Profile page passes `showInstructions={false}` to keep the avatar baseline-aligned with the user's name in the header card.
