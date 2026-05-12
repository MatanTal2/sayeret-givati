# ProfileImageUpload.tsx

**File:** `src/components/profile/ProfileImageUpload.tsx`
**Lines:** 225
**Status:** Active (Firebase Storage + cropper)

## Purpose

Profile image picker → circular cropper → resize → Firebase Storage upload. Returns the public download URL via `onImageUpdate`.

Pipeline:
1. User clicks the avatar (or the hover overlay). Hidden `<input type="file" accept="image/*">` opens. On mobile, this surfaces the system camera as a source option.
2. Validate (must be `image/*`). No hard size cap — see "Camera-shot handling" below.
3. If raw bytes exceed `PRECROP_COMPRESS_THRESHOLD` (4 MB), pre-compress with `browser-image-compression` (`maxWidthOrHeight: 2048`, `maxSizeMB: 2`) so the cropper doesn't choke on huge camera shots.
4. Read file as `data:` URL, mount `ProfileImageCropper` with the data URL.
5. User drags / zooms (range slider) → on **אישור**, cropper renders the cropped region to a 512×512 canvas, exports as JPEG `Blob` (quality 0.92).
6. Cropped blob is re-compressed via `browser-image-compression` (`maxWidthOrHeight: 512`, `maxSizeMB: 0.2`, `useWebWorker: true`, forced `image/jpeg`).
7. Compressed file uploaded to `users/{userId}/profile/{timestamp}.jpg` with `cacheControl: 'public, max-age=31536000, immutable'`.
8. Download URL persisted via `onImageUpdate`.

## Camera-shot handling

The old 5 MB pre-crop reject was killing typical phone-camera uploads — modern cameras routinely produce 6-15 MB JPEGs. Since the final upload is always compressed to 0.2 MB after cropping anyway, the cap was doing no useful work and only failing real users.

Current behavior:
- No size cap at the pick stage.
- Files over 4 MB go through a pre-crop compression pass (down to ~2 MB / 2048 px) before being read into the cropper as a data URL. This avoids slow base64 conversion and runaway memory on the cropper canvas.
- Compression failures (corrupt file, unsupported codec) surface their real error message rather than a generic "upload failed".

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

- `PRECROP_COMPRESS_THRESHOLD = 4 * 1024 * 1024` — files above this are pre-compressed before being handed to the cropper.
- `PRECROP_MAX_DIMENSION = 2048` — pre-compression max edge length.
- `PRECROP_MAX_MB = 2` — pre-compression target size.
- `OUTPUT_DIMENSION = 512` — final width/height in pixels.
- `MAX_OUTPUT_MB = 0.2` — `browser-image-compression` size cap (~200 KB) for the final upload.

## Companion components

- `ProfileImageCropper.tsx` — circular crop UI. See `ProfileImageCropper.md`.
