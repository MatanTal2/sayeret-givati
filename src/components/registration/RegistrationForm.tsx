import { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { validatePersonalNumber, PhoneUtils } from '@/utils/validationUtils';
import OTPVerificationStep from './OTPVerificationStep';
import PersonalDetailsStep from './PersonalDetailsStep';
import AccountDetailsStep from './AccountDetailsStep';
import RegistrationSuccessStep from './RegistrationSuccessStep';
import RecaptchaContainer, { RECAPTCHA_CONTAINER_ID } from './RecaptchaContainer';
import RecaptchaAttribution from './RecaptchaAttribution';
import { PersonalDetailsData, AccountDetailsData } from '@/types/registration';
import { auth } from '@/lib/firebase';
import {
  initRecaptcha,
  resetRecaptcha,
  sendPhoneOtp,
  linkEmailPassword,
  sendVerificationEmail,
  mapFirebaseAuthError,
} from '@/lib/firebasePhoneAuth';
import type { ConfirmationResult } from 'firebase/auth';

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

  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpSendError, setOtpSendError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);

  const [personalDetailsData, setPersonalDetailsData] = useState<PersonalDetailsData | null>(null);
  const [accountDetailsData, setAccountDetailsData] = useState<AccountDetailsData | null>(null);

  const updateCurrentStep = (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => {
    onStepChange?.(step);
  };

  useEffect(() => {
    const validation = validatePersonalNumber(personalNumber);
    setValidationError(validation.errorMessage);
    setIsValid(validation.isValid);
  }, [personalNumber]);

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^0-9]/g, '');
    setPersonalNumber(cleanValue);
  };

  const sendOtpToPhone = async (rawPhone: string): Promise<ConfirmationResult> => {
    const phoneCheck = PhoneUtils.validatePhoneNumber(rawPhone);
    if (!phoneCheck.isValid || !phoneCheck.formattedNumber) {
      throw new Error(phoneCheck.error || TEXT_CONSTANTS.AUTH.OTP_INVALID_PHONE_FORMAT);
    }
    resetRecaptcha();
    const verifier = initRecaptcha(RECAPTCHA_CONTAINER_ID);
    return sendPhoneOtp(phoneCheck.formattedNumber, verifier);
  };

  const handleResendOtp = async () => {
    const result = await sendOtpToPhone(userPhoneNumber);
    setConfirmationResult(result);
  };

  const handleVerifyPersonalNumber = async () => {
    if (!isValid || isVerifying) return;

    setIsVerifying(true);
    setValidationError(null);
    setOtpSendError(null);

    try {
      const response = await fetch('/api/auth/verify-military-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ militaryId: personalNumber }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.alreadyRegistered) {
          setValidationError(TEXT_CONSTANTS.AUTH.ALREADY_REGISTERED);
        } else {
          setValidationError(data.error || 'Failed to verify military ID');
        }
        return;
      }

      setUserPhoneNumber(data.personnel.phoneNumber);
      setUserFirstName(data.personnel.firstName);
      setUserLastName(data.personnel.lastName);

      setIsSendingOTP(true);
      try {
        const confirmation = await sendOtpToPhone(data.personnel.phoneNumber);
        setConfirmationResult(confirmation);
        updateCurrentStep('otp');
      } catch (error) {
        setOtpSendError(mapFirebaseAuthError(error));
      } finally {
        setIsSendingOTP(false);
      }
    } catch {
      setValidationError(TEXT_CONSTANTS.REGISTRATION_COMPONENTS.CONNECTION_ERROR);
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
    if (isSubmittingRegistration) return;

    setIsSubmittingRegistration(true);
    setAccountDetailsData(data);
    setValidationError(null);

    const completeRegistrationData = {
      ...personalDetailsData!,
      ...data,
      phoneNumber: userPhoneNumber,
      militaryPersonalNumber: personalNumber,
    };

    try {
      const phoneAuthUser = auth.currentUser;
      if (!phoneAuthUser) {
        setValidationError(TEXT_CONSTANTS.AUTH.OTP_INTERNAL_ERROR);
        return;
      }

      try {
        await linkEmailPassword(phoneAuthUser, completeRegistrationData.email, completeRegistrationData.password);
      } catch (linkError) {
        setValidationError(mapFirebaseAuthError(linkError));
        return;
      }

      try {
        await sendVerificationEmail(phoneAuthUser);
      } catch {
        // Non-fatal — user can resend later from banner
      }

      const registrationDataWithUid = {
        ...completeRegistrationData,
        firebaseAuthUid: phoneAuthUser.uid,
        emailVerified: phoneAuthUser.emailVerified,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationDataWithUid),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        updateCurrentStep('success');
      } else {
        setValidationError(result.error || 'Profile creation failed. Please contact support.');
      }
    } catch {
      setValidationError(TEXT_CONSTANTS.REGISTRATION_COMPONENTS.CONNECTION_ERROR);
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  const handleContinueToSystem = () => {
    onRegistrationSuccess?.();
  };

  if (currentStep === 'otp') {
    return (
      <>
        <RecaptchaContainer />
        <OTPVerificationStep
          phoneNumber={userPhoneNumber}
          confirmationResult={confirmationResult}
          onVerifySuccess={handleOTPVerifySuccess}
          onResendOtp={handleResendOtp}
        />
        <RecaptchaAttribution />
      </>
    );
  }

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

  if (currentStep === 'success') {
    return (
      <RegistrationSuccessStep
        onContinue={handleContinueToSystem}
      />
    );
  }
  return (
    <>
      <RecaptchaContainer />
      <div className="text-center px-6 pb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-warning-400 to-warning-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-neutral-900 mb-2">{TEXT_CONSTANTS.AUTH.WELCOME_TO_SYSTEM}</h3>
        <p className="text-base text-neutral-600 mb-3">{TEXT_CONSTANTS.AUTH.SYSTEM_SUBTITLE}</p>
      </div>

      <div className="px-6 pb-3">
        <form className="space-y-4">
          <h4 className="text-lg font-semibold text-neutral-800 text-center mb-2">
            {TEXT_CONSTANTS.AUTH.IDENTITY_VERIFICATION}
          </h4>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={personalNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 outline-none transition-all
                         text-right text-neutral-800 bg-neutral-50 focus:bg-white placeholder-neutral-500 ${
                  validationError && personalNumber
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder={TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_PLACEHOLDER}
                maxLength={7}
                data-testid="personal-number-input"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
            </div>

            {validationError && personalNumber && (
              <p
                className="text-sm text-danger-600 text-right px-1"
                data-testid="personal-number-error"
              >
                {validationError}
              </p>
            )}

            {otpSendError && (
              <p
                className="text-sm text-danger-600 text-center px-1"
                data-testid="otp-send-error"
              >
                {otpSendError}
              </p>
            )}

            {!validationError && !otpSendError && (
              <p className="text-sm text-neutral-500 text-center">
                {TEXT_CONSTANTS.AUTH.PERSONAL_NUMBER_HELPER}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleVerifyPersonalNumber}
            disabled={!isValid || isVerifying || isSendingOTP}
            className={`w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                     flex items-center justify-center gap-2
                     transition-all duration-200 ${
              isValid && !isVerifying && !isSendingOTP
                ? 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white hover:shadow-lg'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
            data-testid="verify-button"
          >
            {isVerifying || isSendingOTP ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSendingOTP ? TEXT_CONSTANTS.REGISTRATION_COMPONENTS.SENDING_CODE : TEXT_CONSTANTS.REGISTRATION_COMPONENTS.VERIFYING}
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

          {onSwitchToLogin && (
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-primary-600 hover:text-primary-800
                         transition-all duration-200 underline-offset-2 hover:underline focus-ring rounded-md"
              >
                כבר יש לך חשבון? התחבר כאן
              </button>
            </div>
          )}
        </form>
        <RecaptchaAttribution />
      </div>
    </>
  );
}
