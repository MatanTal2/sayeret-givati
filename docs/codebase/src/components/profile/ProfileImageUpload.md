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

## Bucket CORS (manual, one-time)

Browser uploads from `localhost` or Vercel preview origins fail the CORS preflight unless the bucket is configured. Run once per bucket from a machine with `gsutil` (Google Cloud SDK):

```
gsutil cors set firebase/storage.cors.json gs://sayeret-givati-1983.firebasestorage.app
```

Adjust origins in `firebase/storage.cors.json` if production domains change. Verify with `gsutil cors get gs://sayeret-givati-1983.firebasestorage.app`.

## Defensive rendering

Pre-Storage builds (mock upload) wrote `blob:` URLs into the user document. Those URLs are origin-scoped to a dead session and the browser blocks them on reload. The component (and the three call-site state initialisers in `profile/page.tsx`, `settings/page.tsx`, `WelcomeModal.tsx`) treat anything that is not `http(s)://` as missing — placeholder icon renders instead, and an explicit re-upload overwrites the bad value with a real download URL.

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
