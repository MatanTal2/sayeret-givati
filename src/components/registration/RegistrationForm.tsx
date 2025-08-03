import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validatePersonalNumber } from '@/utils/validationUtils';
import OTPVerificationStep from './OTPVerificationStep';
import PersonalDetailsStep from './PersonalDetailsStep';
import AccountDetailsStep from './AccountDetailsStep';
import RegistrationSuccessStep from './RegistrationSuccessStep';
import { PersonalDetailsData, AccountDetailsData } from '@/types/registration';

interface RegistrationFormProps {
  personalNumber: string;
  setPersonalNumber: (value: string) => void;
  onSwitchToLogin?: () => void;
  onStepChange?: (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => void;
}

export default function RegistrationForm({ personalNumber, setPersonalNumber, onSwitchToLogin, onStepChange }: RegistrationFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [currentStep, setCurrentStep] = useState<'personal-number' | 'otp' | 'personal' | 'account' | 'success'>('personal-number');
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [userLastName, setUserLastName] = useState<string>('');
  
  // Form data for new steps
  const [personalDetailsData, setPersonalDetailsData] = useState<PersonalDetailsData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accountDetailsData, setAccountDetailsData] = useState<AccountDetailsData | null>(null);

  // Helper function to update step and notify parent
  const updateCurrentStep = (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  // Real-time validation
  useEffect(() => {
    const validation = validatePersonalNumber(personalNumber);
    setValidationError(validation.errorMessage);
    setIsValid(validation.isValid);
  }, [personalNumber]);

  // Notify parent of initial step
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const cleanValue = value.replace(/[^0-9]/g, '');
    setPersonalNumber(cleanValue);
  };

  const handleVerifyPersonalNumber = () => {
    console.log('TODO: verify personal number', personalNumber);
    // TODO: Call backend to verify personal number and get user data
    // For now, simulate finding user data from authorized_personnel document
    const mockPhoneNumber = '0521234567';
    const mockFirstName = 'יוסי';
    const mockLastName = 'כהן';
    
    setUserPhoneNumber(mockPhoneNumber);
    setUserFirstName(mockFirstName);
    setUserLastName(mockLastName);
    updateCurrentStep('otp');
  };

  const handleOTPVerifySuccess = () => {
    console.log('OTP verification successful');
    updateCurrentStep('personal');
  };

  const handlePersonalDetailsSubmit = (data: PersonalDetailsData) => {
    console.log('Personal details submitted:', data);
    setPersonalDetailsData(data);
    updateCurrentStep('account');
  };

  const handleAccountDetailsSubmit = (data: AccountDetailsData) => {
    console.log('Account details submitted:', data);
    setAccountDetailsData(data);
    
    // Combine all registration data
    const completeRegistrationData = {
      ...personalDetailsData!,
      ...data,
      phoneNumber: userPhoneNumber
    };
    
    console.log('Complete registration data:', completeRegistrationData);
    // TODO: Submit to backend
    
    updateCurrentStep('success');
  };

  const handleContinueToSystem = () => {
    // This will be handled by the parent component or redirect logic
    console.log('Continuing to system from registration success');
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
        firstName={userFirstName}
        lastName={userLastName}
        onSubmit={handlePersonalDetailsSubmit}
      />
    );
  }

  // Show account details step if we're in that phase
  if (currentStep === 'account') {
    return (
      <AccountDetailsStep 
        onSubmit={handleAccountDetailsSubmit}
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
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        
        {/* Main Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{TEXT_CONSTANTS.AUTH.WELCOME_TO_SYSTEM}</h3>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-3">{TEXT_CONSTANTS.AUTH.SYSTEM_SUBTITLE}</p>
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
            
            {/* Helper Text */}
            {!validationError && (
              <p className="text-sm text-gray-500 text-center">
                {TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_HELPER}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyPersonalNumber}
            disabled={!isValid}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 ${
              isValid
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="verify-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {TEXT_CONSTANTS.AUTH.VERIFY_PERSONAL_NUMBER}
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