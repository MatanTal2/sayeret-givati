import { useState, useEffect, useRef, useCallback } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validateOTP, maskPhoneNumber } from '@/utils/validationUtils';

interface OTPVerificationStepProps {
  phoneNumber: string;
  onVerifySuccess?: () => void;
}

export default function OTPVerificationStep({ 
  phoneNumber, 
  onVerifySuccess 
}: OTPVerificationStepProps) {
  const [otpCode, setOtpCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerifyOTP = useCallback(async () => {
    if (!isValid || isVerifying || !otpCode || otpCode.length !== 6) return;

    setIsVerifying(true);
    setBackendError(null);

    try {
      console.log('🔍 Verifying OTP code');
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber,
          otpCode 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ OTP verified successfully');
        
        // Clear the form
        setOtpCode('');
        setBackendError(null);
        
        // Call success callback to move to next step
        if (onVerifySuccess) {
          onVerifySuccess();
        }
      } else {
        // Handle verification failure
        const errorMessage = data.error || 'קוד האימות שגוי';
        console.log('❌ OTP verification failed:', errorMessage);
        setBackendError(errorMessage);
      }
    } catch (error) {
      console.error('🚨 Error verifying OTP:', error);
      setBackendError('שגיאת חיבור. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
    } finally {
      setIsVerifying(false);
    }
  }, [phoneNumber, otpCode, isValid, isVerifying, onVerifySuccess]);

  // Real-time validation
  useEffect(() => {
    const validation = validateOTP(otpCode);
    setValidationError(validation.errorMessage);
    setIsValid(validation.isValid);
    
    // Auto-verify when 6 digits are entered
    if (validation.isValid && otpCode.length === 6) {
      handleVerifyOTP();
    }
  }, [otpCode, handleVerifyOTP]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(cleanValue);
    // Clear backend errors when user types
    setBackendError(null);
  };

  const handleResendCode = async () => {
    setBackendError(null);
    setOtpCode('');
    setValidationError(null);

    try {
      console.log('📤 Resending OTP to:', phoneNumber);
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ OTP resent successfully');
        // Could show a success message here if needed
      } else {
        const errorMessage = data.error || 'Failed to resend OTP';
        console.log('❌ OTP resend failed:', errorMessage);
        setBackendError(errorMessage);
      }
    } catch (error) {
      console.error('🚨 Error resending OTP:', error);
      setBackendError('שגיאת חיבור. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
    }

    inputRef.current?.focus();
  };

  const maskedPhone = maskPhoneNumber(phoneNumber);

  return (
    <>
      {/* Header */}
      <div className="text-center px-6 pb-4">
        {/* Phone Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{TEXT_CONSTANTS.AUTH.OTP_VERIFICATION}</h3>
        
        {/* Message */}
        <p className="text-base text-gray-600 mb-2">{TEXT_CONSTANTS.AUTH.OTP_SENT_MESSAGE}</p>
        
        {/* Masked Phone Number */}
        <p className="text-sm text-gray-800 font-semibold mb-6">{maskedPhone}</p>
      </div>

      {/* OTP Form */}
      <div className="px-6 pb-5">
        <div className="space-y-4">
          {/* OTP Input Field */}
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={otpCode}
                onChange={handleInputChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-center tracking-widest text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500 ${
                  (validationError && otpCode) || backendError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.OTP_INPUT_PLACEHOLDER}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                data-testid="otp-input"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            {/* Error Messages */}
            {validationError && otpCode && (
              <p 
                className="text-sm text-red-600 text-center px-1"
                data-testid="otp-error"
              >
                {validationError}
              </p>
            )}
            
            {backendError && (
              <p 
                className="text-sm text-red-600 text-center px-1"
                data-testid="otp-backend-error"
              >
                {backendError}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOTP}
            disabled={!isValid || isVerifying}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 ${
              isValid && !isVerifying
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="verify-otp-button"
          >
            {isVerifying ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                מאמת קוד...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {TEXT_CONSTANTS.AUTH.VERIFY_OTP_CODE}
              </>
            )}
          </button>

          {/* Resend Code Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-green-600 hover:text-green-800 
                       transition-all duration-200 underline-offset-2 hover:underline focus-ring rounded-md"
            >
              {TEXT_CONSTANTS.AUTH.RESEND_CODE}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}