'use client';

import { useRef, useState } from 'react';
import { CameraIcon, UserIcon } from 'lucide-react';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '@/lib/firebase';
import { ProfileImageUploadProps, ImageUploadState } from '@/types/profile';
import { TEXT_CONSTANTS } from '@/constants/text';
import ProfileImageCropper from './ProfileImageCropper';

const MAX_PICK_BYTES = 5 * 1024 * 1024;
const OUTPUT_DIMENSION = 512;
const MAX_OUTPUT_MB = 0.2;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

export default function ProfileImageUpload({
  userId,
  currentImageUrl,
  onImageUpdate,
  size = 'medium',
  className = '',
  showInstructions = true,
}: ProfileImageUploadProps) {
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    isUploading: false,
    error: null,
    success: false,
  });
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const textSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  // Pre-Storage builds wrote `blob:` URLs into Firestore via the old mock; those are
  // origin-scoped to a dead session and the browser blocks them on reload. Treat
  // anything that is not http(s) as missing so the placeholder icon renders instead.
  const renderableImageUrl =
    currentImageUrl && /^https?:\/\//i.test(currentImageUrl) ? currentImageUrl : undefined;

  const openPicker = () => {
    if (uploadState.isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadState({
        isUploading: false,
        error: TEXT_CONSTANTS.PROFILE_COMPONENTS.INVALID_FILE_ERROR,
        success: false,
      });
      return;
    }

    if (file.size > MAX_PICK_BYTES) {
      setUploadState({
        isUploading: false,
        error: TEXT_CONSTANTS.PROFILE_COMPONENTS.FILE_SIZE_ERROR,
        success: false,
      });
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUploadState({ isUploading: false, error: null, success: false });
      setPendingImage(dataUrl);
    } catch {
      setUploadState({
        isUploading: false,
        error: TEXT_CONSTANTS.PROFILE_COMPONENTS.UPLOAD_ERROR,
        success: false,
      });
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setPendingImage(null);
    setUploadState({ isUploading: true, error: null, success: false });

    try {
      const croppedFile = new File([croppedBlob], `profile-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      const compressed = await imageCompression(croppedFile, {
        maxWidthOrHeight: OUTPUT_DIMENSION,
        maxSizeMB: MAX_OUTPUT_MB,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });

      const path = `users/${userId}/profile/${Date.now()}.jpg`;
      const objectRef = storageRef(storage, path);
      await uploadBytes(objectRef, compressed, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      });
      const downloadUrl = await getDownloadURL(objectRef);

      onImageUpdate(downloadUrl);
      setUploadState({ isUploading: false, error: null, success: true });

      setTimeout(() => {
        setUploadState((prev) => ({ ...prev, success: false }));
      }, 3000);
    } catch (error) {
      setUploadState({
        isUploading: false,
        error:
          error instanceof Error
            ? error.message
            : TEXT_CONSTANTS.PROFILE_COMPONENTS.UPLOAD_ERROR,
        success: false,
      });
    }
  };

  const handleCropCancel = () => {
    setPendingImage(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        <div
          className={`${sizeClasses[size]} bg-primary-600 rounded-full flex items-center justify-center text-white ${textSizes[size]} font-bold cursor-pointer transition-all duration-200 group-hover:bg-primary-700 overflow-hidden`}
          onClick={openPicker}
        >
          {uploadState.isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : renderableImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={renderableImageUrl}
              alt={TEXT_CONSTANTS.PROFILE_COMPONENTS.PROFILE_ALT}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className={iconSizes[size]} />
          )}
        </div>

        <div
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={openPicker}
        >
          <div className="text-center text-white">
            <CameraIcon className={`${iconSizes[size]} mx-auto mb-1`} />
            <span className="text-xs font-medium">שנה תמונה</span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploadState.isUploading}
      />

      {size !== 'small' && showInstructions && (
        <div className="mt-2 text-center">
          <p className="text-xs text-neutral-500">לחץ להעלאת תמונה חדשה</p>
          <p className="text-xs text-neutral-400">JPG, PNG עד 5MB</p>
        </div>
      )}

      {uploadState.error && (
        <div className="mt-2 text-center">
          <p className="text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded">
            {uploadState.error}
          </p>
        </div>
      )}

      {uploadState.success && (
        <div className="mt-2 text-center">
          <p className="text-xs text-success-600 bg-success-50 px-2 py-1 rounded">
            התמונה הועלתה בהצלחה!
          </p>
        </div>
      )}

      {pendingImage && (
        <ProfileImageCropper
          imageSrc={pendingImage}
          outputSize={OUTPUT_DIMENSION}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
