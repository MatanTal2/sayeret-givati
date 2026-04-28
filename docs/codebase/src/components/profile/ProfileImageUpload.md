# ProfileImageUpload.tsx

**File:** `src/components/profile/ProfileImageUpload.tsx`
**Lines:** 225
**Status:** Active (Firebase Storage + cropper)

## Purpose

Profile image picker → circular cropper → resize → Firebase Storage upload. Returns the public download URL via `onImageUpdate`.

Pipeline:
1. User clicks the avatar (or the hover overlay). Hidden `<input type="file" accept="image/*">` opens.
2. Validate (must be `image/*`, ≤ 5 MB).
3. Read file as `data:` URL, mount `ProfileImageCropper` with the data URL.
4. User drags / zooms (range slider) → on **אישור**, cropper renders the cropped region to a 512×512 canvas, exports as JPEG `Blob` (quality 0.92).
5. Cropped blob is re-compressed via `browser-image-compression` (`maxWidthOrHeight: 512`, `maxSizeMB: 0.2`, `useWebWorker: true`, forced `image/jpeg`).
6. Compressed file uploaded to `users/{userId}/profile/{timestamp}.jpg` with `cacheControl: 'public, max-age=31536000, immutable'`.
7. Download URL persisted via `onImageUpdate`.

The trigger is now the avatar + hover overlay only — the small upload-icon button at the bottom-right of the avatar was removed (bug #6).

## Storage path & rules

- Path: `users/{userId}/profile/{timestamp}.jpg` — one new object per upload, never overwrites prior images. Always JPEG output regardless of source format.
- Rules: `firebase/storage.rules` — owner-only write (`request.auth.uid == userId`), authenticated read, 10 MB cap, image/* content type only.
- Persisted to Firestore by the parent via `updateUserProfile(uid, { profileImage: downloadUrl })`.

## HTTP cache strategy

Each upload writes to a **new** timestamped path; the URL itself is the version signal. Combined with `Cache-Control: public, max-age=31536000, immutable` on the object metadata, the browser HTTP cache stores the image for 1 year and never re-validates. Replacing the avatar yields a different URL → browser fetches once, then serves from `(disk cache)` on subsequent loads. No localStorage / IndexedDB / version-field plumbing needed.

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
| `pendingImage` | `string \| null` | Data URL of the picked image while the cropper modal is open. `null` ⇒ cropper closed. |

## Constants

- `MAX_PICK_BYTES = 5 * 1024 * 1024` — pick-stage size cap (the post-crop file is always far smaller).
- `OUTPUT_DIMENSION = 512` — final width/height in pixels.
- `MAX_OUTPUT_MB = 0.2` — `browser-image-compression` size cap (~200 KB).

## Companion components

- `ProfileImageCropper.tsx` — circular crop UI. See `ProfileImageCropper.md`.
