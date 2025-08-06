'use client';

import { useState } from 'react';
import { PhoneIcon, CheckIcon, XIcon } from 'lucide-react';
import { PhoneNumberUpdateProps, PhoneUpdateState, OTPVerificationRequest } from '@/types/profile';

/**
 * PhoneNumberUpdate component with OTP verification
 * Follows the app's existing UI/UX patterns
 */
export default function PhoneNumberUpdate({ 
  currentPhoneNumber, 
  onPhoneUpdate,
  className = '' 
}: PhoneNumberUpdateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [updateState, setUpdateState] = useState<PhoneUpdateState>({
    isUpdating: false,
    otpSent: false,
    otpVerified: false,
    error: null,
    success: false,
    countdown: 0
  });

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Remove country code and format as XXX-XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('972')) {
      return cleaned.slice(3).replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  // Validate Israeli phone number
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Israeli mobile numbers: 05X-XXX-XXXX
    return /^(972)?0?5[0-9]{8}$/.test(cleaned);
  };

  // Normalize phone number to international format
  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('05')) {
      return `+972${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith('9725')) {
      return `+${cleaned}`;
    }
    return phone;
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setNewPhoneNumber(currentPhoneNumber);
    setUpdateState({
      isUpdating: false,
      otpSent: false,
      otpVerified: false,
      error: null,
      success: false,
      countdown: 0
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewPhoneNumber('');
    setOtpCode('');
    setUpdateState({
      isUpdating: false,
      otpSent: false,
      otpVerified: false,
      error: null,
      success: false,
      countdown: 0
    });
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(newPhoneNumber)) {
      setUpdateState(prev => ({
        ...prev,
        error: 'מספר טלפון לא חוקי. אנא הזן מספר ישראלי תקין'
      }));
      return;
    }

    setUpdateState(prev => ({
      ...prev,
      isUpdating: true,
      error: null
    }));

    try {
      // TODO: Replace with actual OTP sending service
      await mockSendOTP(normalizePhoneNumber(newPhoneNumber));
      
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        otpSent: true,
        countdown: 60
      }));

      // Start countdown
      startCountdown();

    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'שגיאה בשליחת קוד אימות'
      }));
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setUpdateState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setUpdateState(prev => ({
        ...prev,
        error: 'אנא הזן קוד אימות בן 6 ספרות'
      }));
      return;
    }

    setUpdateState(prev => ({
      ...prev,
      isUpdating: true,
      error: null
    }));

    try {
      // TODO: Replace with actual OTP verification service
      await mockVerifyOTP({
        phoneNumber: normalizePhoneNumber(newPhoneNumber),
        otpCode
      });

      // TODO: Replace with actual phone update service
      await mockUpdatePhoneNumber(normalizePhoneNumber(newPhoneNumber));

      onPhoneUpdate(normalizePhoneNumber(newPhoneNumber));
      
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        otpVerified: true,
        success: true
      }));

      // Close modal after success
      setTimeout(() => {
        handleCancel();
      }, 2000);

    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'קוד אימות שגוי'
      }));
    }
  };

  // Mock functions - TODO: Replace with actual API calls
  const mockSendOTP = async (phone: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('Sending OTP to:', phone);
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('שגיאה בשליחת SMS'));
        }
      }, 1500);
    });
  };

  const mockVerifyOTP = async (request: OTPVerificationRequest): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Accept any 6-digit code for demo
        if (request.otpCode.length === 6) {
          resolve();
        } else {
          reject(new Error('קוד אימות שגוי'));
        }
      }, 1000);
    });
  };

  const mockUpdatePhoneNumber = async (newPhoneNumber: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Phone number updated to:', newPhoneNumber);
        resolve();
      }, 500);
    });
  };

  if (!isEditing) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <PhoneIcon className="w-5 h-5 text-gray-400" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון</label>
            <div className="text-gray-900">{formatPhoneDisplay(currentPhoneNumber)}</div>
          </div>
        </div>
        <button
          onClick={handleEditStart}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
        >
          עדכן
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Phone Number Input */}
      {!updateState.otpSent && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר טלפון חדש
            </label>
            <div className="flex gap-3">
              <input
                type="tel"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                placeholder="05X-XXX-XXXX"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={updateState.isUpdating}
              />
              <button
                onClick={handleSendOTP}
                disabled={updateState.isUpdating || !newPhoneNumber}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {updateState.isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'שלח קוד'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification */}
      {updateState.otpSent && !updateState.otpVerified && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              נשלח קוד אימות למספר: {formatPhoneDisplay(newPhoneNumber)}
            </p>
            <p className="text-xs text-blue-600">
              הקוד תקף למשך 5 דקות
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קוד אימות (6 ספרות)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg font-mono"
                disabled={updateState.isUpdating}
              />
              <button
                onClick={handleVerifyOTP}
                disabled={updateState.isUpdating || otpCode.length !== 6}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {updateState.isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Resend OTP */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSendOTP}
              disabled={updateState.countdown > 0 || updateState.isUpdating}
              className="text-sm text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {updateState.countdown > 0 
                ? `שלח שוב בעוד ${updateState.countdown}s`
                : 'שלח קוד שוב'
              }
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {updateState.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckIcon className="w-5 h-5" />
            <span className="font-medium">מספר הטלפון עודכן בהצלחה!</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {updateState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{updateState.error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {!updateState.success && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCancel}
            disabled={updateState.isUpdating}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <XIcon className="w-4 h-4" />
            ביטול
          </button>
        </div>
      )}
    </div>
  );
}