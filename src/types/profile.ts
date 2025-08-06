/**
 * Profile-related types for image upload and phone number updates
 */

export interface ImageUploadState {
  isUploading: boolean;
  error: string | null;
  success: boolean;
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface PhoneUpdateRequest {
  newPhoneNumber: string;
  otpCode?: string;
}

export interface PhoneUpdateState {
  isUpdating: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  error: string | null;
  success: boolean;
  countdown: number;
}

export interface PhoneUpdateResult {
  success: boolean;
  message: string;
  error?: string;
  requiresOTP?: boolean;
}

export interface OTPVerificationRequest {
  phoneNumber: string;
  otpCode: string;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface PhoneNumberUpdateProps {
  currentPhoneNumber: string;
  onPhoneUpdate: (newPhoneNumber: string) => void;
  className?: string;
}

export interface OTPInputProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

// Component prop types
export interface ProfileImageDisplayProps {
  imageUrl?: string;
  initials?: string;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  onClick?: () => void;
  className?: string;
}