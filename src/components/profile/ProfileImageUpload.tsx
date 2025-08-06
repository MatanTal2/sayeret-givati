'use client';

import { useState, useRef } from 'react';
import { CameraIcon, UserIcon, UploadIcon } from 'lucide-react';
import { ProfileImageUploadProps, ImageUploadState } from '@/types/profile';

/**
 * ProfileImageUpload component for uploading and updating profile images
 * Follows the app's existing UI/UX patterns
 */
export default function ProfileImageUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  size = 'medium',
  className = '' 
}: ProfileImageUploadProps) {
  const [uploadState, setUploadState] = useState<ImageUploadState>({
    isUploading: false,
    error: null,
    success: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const textSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadState({
        isUploading: false,
        error: 'אנא בחר קובץ תמונה חוקי',
        success: false
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadState({
        isUploading: false,
        error: 'גודל הקובץ חייב להיות קטן מ-5MB',
        success: false
      });
      return;
    }

    setUploadState({
      isUploading: true,
      error: null,
      success: false
    });

    try {
      // TODO: Replace with actual image upload service
      await mockImageUpload(file);
      
      // Create temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      onImageUpdate(imageUrl);
      
      setUploadState({
        isUploading: false,
        error: null,
        success: true
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);
      
    } catch (error) {
      setUploadState({
        isUploading: false,
        error: error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה',
        success: false
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mock image upload function
  const mockImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        if (Math.random() > 0.1) { // 90% success rate
          resolve(`/api/uploads/${file.name}`);
        } else {
          reject(new Error('שגיאה בהעלאת התמונה לשרת'));
        }
      }, 2000); // Simulate upload time
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Profile Image Container */}
      <div className="relative group">
        <div 
          className={`${sizeClasses[size]} bg-purple-600 rounded-full flex items-center justify-center text-white ${textSizes[size]} font-bold cursor-pointer transition-all duration-200 group-hover:bg-purple-700 overflow-hidden`}
          onClick={handleImageSelect}
        >
          {uploadState.isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : currentImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className={iconSizes[size]} />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
             onClick={handleImageSelect}>
          <div className="text-center text-white">
            <CameraIcon className={`${iconSizes[size]} mx-auto mb-1`} />
            <span className="text-xs font-medium">שנה תמונה</span>
          </div>
        </div>

        {/* Upload Button for larger sizes */}
        {size !== 'small' && (
          <button
            onClick={handleImageSelect}
            disabled={uploadState.isUploading}
            className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 disabled:bg-gray-400"
            title="העלה תמונה"
          >
            {uploadState.isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <UploadIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploadState.isUploading}
      />

      {/* Upload Instructions */}
      {size !== 'small' && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            לחץ להעלאת תמונה חדשה
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG עד 5MB
          </p>
        </div>
      )}

      {/* Status Messages */}
      {uploadState.error && (
        <div className="mt-2 text-center">
          <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {uploadState.error}
          </p>
        </div>
      )}

      {uploadState.success && (
        <div className="mt-2 text-center">
          <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            התמונה הועלתה בהצלחה!
          </p>
        </div>
      )}
    </div>
  );
}