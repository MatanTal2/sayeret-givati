# ProfileImageCropper.tsx

**File:** `src/components/profile/ProfileImageCropper.tsx`
**Lines:** 153
**Status:** Active

## Purpose

Modal circular cropper for the profile image flow. Wraps `react-easy-crop` with drag-to-position + range-slider zoom and outputs a square `Blob` ready for upload.

## Flow

1. Parent passes `imageSrc` (a `data:` URL produced from the user's picked file).
2. User drags the crop area and adjusts zoom (1× → 3×). `react-easy-crop` invokes `onCropComplete` with `Area` pixel coordinates on every change.
3. On **אישור**:
   - Load the source `data:` URL into an `<img>`.
   - Draw the crop region onto an off-screen `<canvas>` sized to `outputSize` × `outputSize` (default 512).
   - Export as `image/jpeg` at quality 0.92 via `canvas.toBlob`.
   - Resolve `onConfirm(blob)`.
4. On **ביטול**: invoke `onCancel`. Parent unmounts the cropper.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `imageSrc` | `string` | yes | — | Image URL (`data:` URL or `blob:` URL — must be same-origin so canvas can read it without tainting) |
| `outputSize` | `number` | no | `512` | Side length in pixels of the rendered output (square) |
| `onCancel` | `() => void` | yes | — | Called when user cancels |
| `onConfirm` | `(blob: Blob) => void \| Promise<void>` | yes | — | Called with the cropped `Blob`. The cropper awaits the returned promise and shows a "מעבד..." state while pending. |

## Notes

- **JPEG, not PNG.** Profile photos compress better as JPEG and the immutable-cache pipeline assumes a single content type.
- **Canvas tainting.** Source images must be same-origin for `toBlob` to work. The parent always passes a `data:` URL (file picker → `FileReader.readAsDataURL`), which is treated as same-origin.
- **No image rotation handling.** EXIF orientation is not corrected. If users complain about sideways portrait photos from iOS, add `rotation` state + `transformations: { translate, rotate, scale }` to the canvas drawImage step.
- **Reusability.** When extracting a generic uploader (Part B of the polish plan), pull `outputSize`, `cropShape`, and `aspect` up to props and rename to `ImageCropper`.
