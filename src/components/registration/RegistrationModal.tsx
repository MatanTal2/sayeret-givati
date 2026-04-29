import { useEffect, useRef, useState } from 'react';
import RegistrationHeader from './RegistrationHeader';
import RegistrationForm from './RegistrationForm';
import RegistrationFooter from './RegistrationFooter';
import RegistrationStepDots, { RegistrationStep } from './RegistrationStepDots';
import RecaptchaContainer from './RecaptchaContainer';
import { auth } from '@/lib/firebase';
import {
  deleteCurrentUser,
  signOutCurrentUser,
  RequiresRecentLoginError,
} from '@/lib/firebasePhoneAuth';
import {
  clearRegistrationInProgress,
  isRegistrationInProgress,
} from '@/lib/registrationFlowFlag';
import { UserDataService } from '@/lib/userDataService';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
  onRegistrationSuccess?: () => void;
}

export default function RegistrationModal({ isOpen, onClose, onSwitch, onRegistrationSuccess }: RegistrationModalProps) {
  const [personalNumber, setPersonalNumber] = useState('');
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal-number');
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const registrationCompleteRef = useRef(false);

  // Cleanup orphan Firebase Auth user when the user abandons the flow.
  // Guarded so we never delete a fully-registered user that happened to
  // reopen the modal and re-confirm OTP onto their existing account:
  //   1. registrationCompleteRef — set on the success step.
  //   2. registrationInProgress flag — only set during a fresh OTP confirm.
  //   3. Firestore profile lookup — if a profile exists, the user is real,
  //      skip delete and only clear the in-progress flag.
  // If Firebase rejects delete with requires-recent-login (>5 min after OTP),
  // fall back to signOut — AuthContext will refuse to mark the orphan as
  // authenticated on the next page load.
  const cleanupOrphanAuthUser = async () => {
    if (registrationCompleteRef.current) return;
    const user = auth.currentUser;
    if (!user) return;
    if (!isRegistrationInProgress()) return;

    try {
      const result = await UserDataService.fetchUserDataByUid(user.uid);
      if (result.success && result.userData) {
        // Real user — never delete. Just clear the flag.
        clearRegistrationInProgress();
        return;
      }
    } catch (err) {
      console.error('[RegistrationModal] profile lookup failed', err);
      // Conservative: if lookup fails, do not delete; signOut so AuthContext
      // re-evaluates next load.
      try { await signOutCurrentUser(); } catch { /* swallow */ }
      clearRegistrationInProgress();
      return;
    }

    try {
      await deleteCurrentUser();
    } catch (err) {
      if (err instanceof RequiresRecentLoginError) {
        try { await signOutCurrentUser(); } catch { /* swallow */ }
      } else {
        console.error('[RegistrationModal] cleanup failed', err);
        try { await signOutCurrentUser(); } catch { /* swallow */ }
      }
    } finally {
      clearRegistrationInProgress();
    }
  };

  // Unmount cleanup — covers route-change abandon. Intentional empty deps:
  // we only want this to run on unmount; the helper closure is defined inline
  // and the cleanup logic is idempotent.
  useEffect(() => {
    return () => {
      void cleanupOrphanAuthUser();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    // Block close while account creation (linkEmailPassword + register API)
    // is in flight — closing mid-link would leave a half-linked auth user.
    if (isSubmittingRegistration) return;
    void cleanupOrphanAuthUser();
    setPersonalNumber('');
    setCurrentStep('personal-number');
    onClose();
  };

  const handleSwitchToLogin = () => {
    if (isSubmittingRegistration) return;
    void cleanupOrphanAuthUser();
    setPersonalNumber('');
    setCurrentStep('personal-number');
    onSwitch();
  };

  const handleRegistrationComplete = () => {
    registrationCompleteRef.current = true;
    clearRegistrationInProgress();
    onRegistrationSuccess?.();
  };

  const handleStepChange = (step: RegistrationStep) => {
    setCurrentStep(step);
  };

  // Dynamic back navigation based on current step
  const handleBackNavigation = () => {
    if (isSubmittingRegistration) return;
    switch (currentStep) {
      case 'personal-number':
        handleSwitchToLogin(); // Go to login
        break;
      case 'otp':
        setCurrentStep('personal-number'); // Go to ID verification
        break;
      case 'personal':
        setCurrentStep('otp'); // Go to OTP
        break;
      case 'account':
        setCurrentStep('personal'); // Go to personal details
        break;
      // success step has no back button behavior
      default:
        handleSwitchToLogin();
    }
  };

  return (
    <>
      {/* Backdrop - Blur Only. Disable click-to-close while account is being
          created so the user cannot abandon the linkEmailPassword + register
          API call mid-flight. */}
      <div
        className="fixed inset-0 z-50 backdrop-enter backdrop-blur-sm bg-black/20"
        onClick={isSubmittingRegistration ? undefined : handleClose}
      />
      
      {/* reCAPTCHA host — kept at modal level so the DOM node persists across
          step transitions; Firebase RecaptchaVerifier caches a reference to
          this node and re-mounting it (when the form re-renders for a new
          step) would orphan the verifier and break OTP resend. */}
      <RecaptchaContainer />

      {/* Modal Container - Centered for all screen sizes */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm h-[600px] modal-enter pointer-events-auto
                my-4 sm:my-8 flex flex-col">

          <RegistrationHeader
            onBack={handleBackNavigation}
            onClose={handleClose}
            disabled={isSubmittingRegistration}
          />
          
          {/* Progress Stepper */}
          <div className="px-6 pt-2">
            <RegistrationStepDots currentStep={currentStep} />
          </div>
          
          <RegistrationForm
            personalNumber={personalNumber}
            setPersonalNumber={setPersonalNumber}
            onSwitchToLogin={handleSwitchToLogin}
            onStepChange={handleStepChange}
            currentStep={currentStep}
            onRegistrationSuccess={handleRegistrationComplete}
            onSubmittingChange={setIsSubmittingRegistration}
          />
          
          <RegistrationFooter showRegistrationNote={currentStep === 'personal-number'} />
        </div>
      </div>
    </>
  );
}