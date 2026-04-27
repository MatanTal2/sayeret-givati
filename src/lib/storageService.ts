/**
 * Firebase Storage upload helpers for equipment photos.
 *
 * Why client-side upload: Firebase Storage writes authenticate via the user's
 * Firebase ID token and are gated by storage.rules. That keeps admin-SDK
 * credentials off the client and avoids running every upload through a
 * Next.js API route (which adds bandwidth + latency).
 *
 * Why compression: military gear photos from phone cameras are 4–8 MB each.
 * Bulk sign-up with per-item photos would blow storage costs without downscale.
 * We resize the longest edge to 1600 px and re-encode as JPEG Q 0.82, which
 * keeps detail readable for audit while shrinking typical photos to ~200 KB.
 */

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const STORAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB hard cap on raw input
export const STORAGE_MAX_DIMENSION = 1600;
export const STORAGE_JPEG_QUALITY = 0.82;

export type EquipmentPhotoKind = 'signup' | 'report';

export interface UploadResult {
  url: string;
  path: string;
  sizeBytes: number;
}

/**
 * Compresses a Blob (or File) down to a max dimension and re-encodes as JPEG.
 * Falls through unchanged if the input is smaller than the target.
 */
export async function compressImage(input: Blob): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // SSR safety: no canvas available. Return as-is; the caller is client-only.
    return input;
  }

  const bitmap = await createImageBitmap(input);
  const { width, height } = bitmap;
  const scale = Math.min(1, STORAGE_MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return input;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      STORAGE_JPEG_QUALITY,
    );
  });
}

/**
 * Upload an equipment photo. `kind` segments signup vs. report photos in Storage
 * so we can apply different retention or audit policies later without migration.
 */
export async function uploadEquipmentPhoto(
  input: Blob | File,
  equipmentId: string,
  kind: EquipmentPhotoKind,
): Promise<UploadResult> {
  if (input.size > STORAGE_MAX_INPUT_BYTES) {
    throw new Error(`Photo exceeds ${Math.round(STORAGE_MAX_INPUT_BYTES / 1024 / 1024)}MB limit`);
  }
  if (!input.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  const compressed = await compressImage(input);
  const path = `equipment/${equipmentId}/${kind}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(snap.ref);
  return { url, path, sizeBytes: compressed.size };
}

/**
 * Upload a profile image. Kept separate from equipment photos because the
 * path layout and rules will diverge (profile images are per-user lifetime).
 */
export async function uploadProfileImage(input: Blob | File, userId: string): Promise<UploadResult> {
  if (input.size > STORAGE_MAX_INPUT_BYTES) {
    throw new Error(`Image exceeds ${Math.round(STORAGE_MAX_INPUT_BYTES / 1024 / 1024)}MB limit`);
  }
  if (!input.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  const compressed = await compressImage(input);
  const path = `users/${userId}/profile-${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(snap.ref);
  return { url, path, sizeBytes: compressed.size };
}
