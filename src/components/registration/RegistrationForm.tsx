import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validatePersonalNumber } from '@/utils/validationUtils';
import OTPVerificationStep from './OTPVerificationStep';
import PersonalDetailsStep from './PersonalDetailsStep';
import AccountDetailsStep from './AccountDetailsStep';
import RegistrationSuccessStep from './RegistrationSuccessStep';
import { PersonalDetailsData, AccountDetailsData } from '@/types/registration';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface RegistrationFormProps {
  personalNumber: string;
  setPersonalNumber: (value: string) => void;
  onSwitchToLogin?: () => void;
  onStepChange?: (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => void;
  currentStep: 'personal-number' | 'otp' | 'personal' | 'account' | 'success';
  onRegistrationSuccess?: () => void;
}

export default function RegistrationForm({ personalNumber, setPersonalNumber, onSwitchToLogin, onStepChange, currentStep, onRegistrationSuccess }: RegistrationFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [userLastName, setUserLastName] = useState<string>('');
  
  // OTP-related state
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpSendError, setOtpSendError] = useState<string | null>(null);
  
  // Registration submission state
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  
  // Form data for new steps
  const [personalDetailsData, setPersonalDetailsData] = useState<PersonalDetailsData | null>(null);
  const [accountDetailsData, setAccountDetailsData] = useState<AccountDetailsData | null>(null);

  // Helper function to notify parent of step change
  const updateCurrentStep = (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => {
    onStepChange?.(step);
  };

  // Real-time validation
  useEffect(() => {
    const validation = validatePersonalNumber(personalNumber);
    setValidationError(validation.errorMessage);
    setIsValid(validation.isValid);
  }, [personalNumber]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const cleanValue = value.replace(/[^0-9]/g, '');
    setPersonalNumber(cleanValue);
  };

  // Send OTP to user's phone number
  const sendOTPToUser = async (phoneNumber: string) => {
    setIsSendingOTP(true);
    setOtpSendError(null);

    try {

      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success) {

      } else {
        const errorMessage = data.error || 'Failed to send OTP';

        setOtpSendError(errorMessage);
      }
    } catch {
      setOtpSendError('שגיאת חיבור. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyPersonalNumber = async () => {
    if (!isValid || isVerifying) return;

    setIsVerifying(true);
    setValidationError(null);

    try {
  
      
      const response = await fetch('/api/auth/verify-military-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ militaryId: personalNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success) {

        
        // Store the personnel data from authorized_personnel collection
        setUserPhoneNumber(data.personnel.phoneNumber);
        setUserFirstName(data.personnel.firstName);
        setUserLastName(data.personnel.lastName);
        

        
        // Auto-send OTP before moving to verification step
        await sendOTPToUser(data.personnel.phoneNumber);
        
        // Move to OTP verification step
        updateCurrentStep('otp');
      } else {
        // Handle verification failure
        const errorMessage = data.error || 'Failed to verify military ID';

        setValidationError(errorMessage);
      }
    } catch {
      setValidationError('Connection error. Please check your internet connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOTPVerifySuccess = () => {
    updateCurrentStep('personal');
  };

  const handlePersonalDetailsSubmit = (data: PersonalDetailsData) => {
    setPersonalDetailsData(data);
    updateCurrentStep('account');
  };

  const handleAccountDetailsSubmit = async (data: AccountDetailsData) => {
    if (isSubmittingRegistration) return; // Prevent multiple clicks
    
    setIsSubmittingRegistration(true);
    setAccountDetailsData(data);
    setValidationError(null);
    
    // Combine all registration data including military ID
    const completeRegistrationData = {
      ...personalDetailsData!,
      ...data,
      phoneNumber: userPhoneNumber,
      militaryPersonalNumber: personalNumber // Include military ID
    };
    
    try {
      let isExistingAuthUser = false;

      // Step 1: Create Firebase Auth user first
      try {
        await createUserWithEmailAndPassword(
          auth,
          completeRegistrationData.email,
          completeRegistrationData.password
        );
      } catch (authError: unknown) {
        if (authError instanceof Error && authError.message.includes('email-already-in-use')) {
          isExistingAuthUser = true;
          // Don't throw error, continue to Firestore profile creation
        } else {
          // For other auth errors, re-throw to be handled in outer catch
          throw authError;
        }
      }
      
      // Step 2: Create Firestore user profile (or verify it exists)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeRegistrationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // User is automatically logged in if Firebase Auth user was created
        // If existing auth user, they may need to login manually
        updateCurrentStep('success');
      } else {
        if (isExistingAuthUser) {
          setValidationError('Profile verification failed. If you already have an account, please try logging in.');
        } else {
          setValidationError(result.error || 'Profile creation failed. Please contact support.');
        }
      }
    } catch (error) {
      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('weak-password')) {
          setValidationError('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('invalid-email')) {
          setValidationError('Invalid email address format.');
        } else {
          setValidationError('Registration failed. Please try again or contact support.');
        }
      } else {
        setValidationError('Connection error. Please check your internet connection and try again.');
      }
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const handleContinueToSystem = () => {
    // Call the success callback to close modal and redirect
    if (onRegistrationSuccess) {
      onRegistrationSuccess();
    }
  };

  // Show OTP step if we're in that phase
  if (currentStep === 'otp') {
    return (
      <OTPVerificationStep 
        phoneNumber={userPhoneNumber}
        onVerifySuccess={handleOTPVerifySuccess}
      />
    );
  }

  // Show personal details step if we're in that phase
  if (currentStep === 'personal') {
    return (
      <PersonalDetailsStep 
        firstName={personalDetailsData?.firstName || userFirstName}
        lastName={personalDetailsData?.lastName || userLastName}
        gender={personalDetailsData?.gender || ''}
        birthdate={personalDetailsData?.birthdate || ''}
        onSubmit={handlePersonalDetailsSubmit}
      />
    );
  }

  // Show account details step if we're in that phase
  if (currentStep === 'account') {
    return (
      <AccountDetailsStep 
        email={accountDetailsData?.email || ''}
        password={accountDetailsData?.password || ''}
        consent={accountDetailsData?.consent || false}
        onSubmit={handleAccountDetailsSubmit}
        isSubmitting={isSubmittingRegistration}
      />
    );
  }

  // Show success step if registration is complete
  if (currentStep === 'success') {
    return (
      <RegistrationSuccessStep 
        onContinue={handleContinueToSystem}
      />
    );
  }
  return (
    <>
      {/* Registration Content */}
      <div className="text-center px-6 pb-4">
        {/* Medal Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        
        {/* Main Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{TEXT_CONSTANTS.AUTH.WELCOME_TO_SYSTEM}</h3>
        
        {/* Subtitle */}
        <p className="text-base text-gray-600 mb-3">{TEXT_CONSTANTS.AUTH.SYSTEM_SUBTITLE}</p>
      </div>

      {/* Registration Form */}
      <div className="px-6 pb-3">
        <form className="space-y-4">
          {/* Section Title */}
          <h4 className="text-lg font-semibold text-gray-800 text-center mb-2">
            {TEXT_CONSTANTS.AUTH.IDENTITY_VERIFICATION}
          </h4>
          
          {/* Personal Number Field */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={personalNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-gray-800 bg-gray-50 focus:bg-white placeholder-gray-500 ${
                  validationError && personalNumber
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_PLACEHOLDER}
                maxLength={7}
                data-testid="personal-number-input"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
            </div>
            
            {/* Error Message */}
            {validationError && personalNumber && (
              <p 
                className="text-sm text-red-600 text-right px-1"
                data-testid="personal-number-error"
              >
                {validationError}
              </p>
            )}
            
            {/* OTP Send Error */}
            {otpSendError && (
              <p 
                className="text-sm text-red-600 text-center px-1"
                data-testid="otp-send-error"
              >
                {otpSendError}
              </p>
            )}
            
            {/* Helper Text */}
            {!validationError && !otpSendError && (
              <p className="text-sm text-gray-500 text-center">
                {TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_HELPER}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyPersonalNumber}
            disabled={!isValid || isVerifying || isSendingOTP}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 ${
              isValid && !isVerifying && !isSendingOTP
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="verify-button"
          >
            {isVerifying || isSendingOTP ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSendingOTP ? 'שולח קוד...' : 'מאמת...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {TEXT_CONSTANTS.AUTH.VERIFY_PERSONAL_NUMBER}
              </>
            )}
          </button>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-purple-600 hover:text-purple-800 
                         transition-all duration-200 underline-offset-2 hover:underline focus-ring rounded-md"
              >
                כבר יש לך חשבון? התחבר כאן
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}