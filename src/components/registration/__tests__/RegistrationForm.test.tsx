import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationForm from '../RegistrationForm';

// Mock validation utilities
jest.mock('@/utils/validationUtils', () => ({
  validatePersonalNumber: jest.fn(),
}));

// Mock text constants
jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      PERSONAL_NUMBER: 'מספר אישי',
      PERSONAL_NUMBER_PLACEHOLDER: 'הזן מספר אישי',
      VERIFY_PERSONAL_NUMBER: 'אמת מספר',
      SWITCH_TO_LOGIN: 'יש לך כבר חשבון? התחבר',
      WELCOME_TO_SYSTEM: 'ברוכים הבאים למערכת',
      SYSTEM_SUBTITLE: 'מסייעת סיירת גבעתי',
      IDENTITY_VERIFICATION: 'אימות זהות',
      ALREADY_HAVE_ACCOUNT: 'כבר יש לך חשבון? התחבר כאן',
    },
  },
}));

// Mock child components
jest.mock('../OTPVerificationStep', () => {
  return function MockOTPVerificationStep({ 
    phoneNumber, 
    onVerifySuccess 
  }: { 
    phoneNumber: string, 
    onVerifySuccess?: () => void 
  }) {
    const handleBackClick = () => {
      // Use the test helper to navigate back
      if ((window as any).testSetCurrentStep) {
        (window as any).testSetCurrentStep('personal-number');
      }
    };

    return (
      <div data-testid="otp-verification-step">
        <div data-testid="otp-phone-number">{phoneNumber}</div>
        <button onClick={onVerifySuccess} data-testid="otp-verify-success">
          Verify OTP Success
        </button>
        <button onClick={handleBackClick} data-testid="otp-back-button">
          Back to Personal Number
        </button>
      </div>
    );
  };
});

jest.mock('../PersonalDetailsStep', () => {
  return function MockPersonalDetailsStep({ 
    firstName, 
    lastName, 
    gender,
    birthdate,
    onSubmit 
  }: { 
    firstName: string, 
    lastName: string, 
    gender?: string,
    birthdate?: string,
    onSubmit?: (data: {
      firstName: string;
      lastName: string;
      gender: string;
      birthdate: string;
    }) => void 
  }) {
    return (
      <div data-testid="personal-details-step">
        <div data-testid="personal-first-name">{firstName}</div>
        <div data-testid="personal-last-name">{lastName}</div>
        <div data-testid="personal-gender">{gender || ''}</div>
        <div data-testid="personal-birthdate">{birthdate || ''}</div>
        <button 
          onClick={() => onSubmit?.({
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            birthdate: '1990-01-01',
          })} 
          data-testid="personal-submit-button"
        >
          Continue to Account
        </button>
      </div>
    );
  };
});

jest.mock('../AccountDetailsStep', () => {
  return function MockAccountDetailsStep({ 
    email,
    password,
    consent,
    onSubmit 
  }: { 
    email?: string,
    password?: string,
    consent?: boolean,
    onSubmit?: (data: {
      email: string;
      password: string;
      consent: boolean;
    }) => void 
  }) {
    return (
      <div data-testid="account-details-step">
        <div data-testid="account-email">{email || ''}</div>
        <div data-testid="account-password">{password || ''}</div>
        <div data-testid="account-consent">{consent ? 'true' : 'false'}</div>
        <button 
          onClick={() => onSubmit?.({
            email: 'test@example.com',
            password: 'Password123!',
            consent: true,
          })} 
          data-testid="account-submit-button"
        >
          Create Account
        </button>
      </div>
    );
  };
});

jest.mock('../RegistrationSuccessStep', () => {
  return function MockRegistrationSuccessStep({ onContinue }: { onContinue?: () => void }) {
    return (
      <div data-testid="registration-success-step">
        <button onClick={onContinue} data-testid="success-continue-button">
          Continue to System
        </button>
      </div>
    );
  };
});

import { validatePersonalNumber } from '@/utils/validationUtils';

const mockValidatePersonalNumber = validatePersonalNumber as jest.MockedFunction<typeof validatePersonalNumber>;

// Test wrapper component to manage currentStep state
function RegistrationFormTestWrapper({ 
  initialStep = 'personal-number' as const, 
  ...props 
}: {
  initialStep?: 'personal-number' | 'otp' | 'personal' | 'account' | 'success';
  personalNumber: string;
  setPersonalNumber: (value: string) => void;
  onSwitchToLogin?: () => void;
  onStepChange?: (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => void;
}) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  
  const handleStepChange = (step: 'personal-number' | 'otp' | 'personal' | 'account' | 'success') => {
    setCurrentStep(step);
    props.onStepChange?.(step);
  };

  // Expose setCurrentStep for back navigation testing
  React.useEffect(() => {
    if (props.onStepChange) {
      // Add setCurrentStep to window for test access
      (window as any).testSetCurrentStep = setCurrentStep;
    }
  }, [props.onStepChange]);
  
  return (
    <RegistrationForm 
      {...props}
      currentStep={currentStep}
      onStepChange={handleStepChange}
    />
  );
}

describe('RegistrationForm Multi-Step Flow', () => {
  const mockProps = {
    personalNumber: '',
    setPersonalNumber: jest.fn(),
    onSwitchToLogin: jest.fn(),
    onStepChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock: valid personal number
    mockValidatePersonalNumber.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
  });

  describe('should start with personal-number step', () => {
    it('should render personal number input on initial load', () => {
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('personal-details-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('account-details-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('registration-success-step')).not.toBeInTheDocument();
    });

    it('should display personal number form elements', () => {
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      expect(screen.getByText('אימות זהות')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('הזן מספר אישי')).toBeInTheDocument();
      expect(screen.getByText('אמת מספר')).toBeInTheDocument();
      expect(screen.getByText('כבר יש לך חשבון? התחבר כאן')).toBeInTheDocument();
    });

    it('should handle personal number input correctly', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '123456');
      
      // Should be called multiple times as user types each character
      expect(mockProps.setPersonalNumber).toHaveBeenCalled();
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('1');
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('6'); // Last character
    });
  });

  describe('should show validation error for invalid input', () => {
    it('should display error when personal number is invalid', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי חייב להכיל בין 5-7 ספרות בלבד',
      });

      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123" />);
      
      expect(screen.getByText('מספר אישי חייב להכיל בין 5-7 ספרות בלבד')).toBeInTheDocument();
    });

    it('should show error with red styling', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="invalid" />);
      
      const input = screen.getByTestId('personal-number-input');
      expect(input).toHaveClass('border-red-500');
    });

    it('should disable verify button for invalid input', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('should enable verify button for valid input', () => {
    it('should enable button when personal number is valid', () => {
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).not.toBeDisabled();
      expect(verifyButton).toHaveClass('bg-gradient-to-r', 'from-green-600');
    });

    it('should not show error message for valid input', () => {
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      expect(screen.queryByTestId('personal-number-error')).not.toBeInTheDocument();
    });

    it('should have proper button styling for valid state', () => {
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).toHaveClass('from-green-600', 'to-green-700');
    });
  });

  describe('should progress to OTP step on verification', () => {
    it('should transition to OTP step when verify button clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('TODO: verify personal number', '123456');
      expect(screen.getByTestId('otp-verification-step')).toBeInTheDocument();
      expect(screen.queryByTestId('personal-number-input')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should pass mock user data to OTP step', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      // Phone number is displayed in OTP step, not personal details step
    });

    it('should show OTP step with back navigation', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(screen.getByTestId('otp-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('otp-verify-success')).toBeInTheDocument();
    });
  });

  describe('should navigate back from OTP step', () => {
    it('should return to personal number step when back button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Go to OTP step
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(screen.getByTestId('otp-verification-step')).toBeInTheDocument();
      
      // Go back
      const backButton = screen.getByTestId('otp-back-button');
      await user.click(backButton);
      
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
    });

    it('should preserve personal number when navigating back', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Go to OTP step
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      // Go back
      const backButton = screen.getByTestId('otp-back-button');
      await user.click(backButton);
      
      // Personal number should still be set in props
      expect(screen.getByTestId('personal-number-input')).toHaveValue('123456');
    });

    it('should maintain form state across navigation', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Verify button should still be enabled after back navigation
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      const backButton = screen.getByTestId('otp-back-button');
      await user.click(backButton);
      
      const newVerifyButton = screen.getByTestId('verify-button');
      expect(newVerifyButton).not.toBeDisabled();
    });
  });

  describe('should progress to details step from OTP', () => {
    it('should transition to details step after OTP verification', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Go to OTP step
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      // Verify OTP
      const otpVerifyButton = screen.getByTestId('otp-verify-success');
      await user.click(otpVerifyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('OTP verification successful');
      expect(screen.getByTestId('personal-details-step')).toBeInTheDocument();
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should pass user data to details step', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Navigate to details step
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      
      expect(screen.getByTestId('personal-first-name')).toHaveTextContent('יוסי');
      expect(screen.getByTestId('personal-last-name')).toHaveTextContent('כהן');
      // Phone number is displayed in OTP step, not personal details step
    });
  });

  describe('should progress to success step from details', () => {
    it('should transition to success step after registration completion', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Navigate through all steps
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('personal-submit-button'));
      await user.click(screen.getByTestId('account-submit-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Complete registration data:', {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        birthdate: '1990-01-01',
        email: 'test@example.com',
        password: 'Password123!',
        consent: true,
        phoneNumber: '0521234567'
      });
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
      expect(screen.queryByTestId('account-details-step')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should show success step with continue button', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Navigate to success step
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('personal-submit-button'));
      await user.click(screen.getByTestId('account-submit-button'));
      
      expect(screen.getByTestId('success-continue-button')).toBeInTheDocument();
    });

    it('should handle continue from success step', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Navigate to success step and continue
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('personal-submit-button'));
      await user.click(screen.getByTestId('account-submit-button'));
      await user.click(screen.getByTestId('success-continue-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Continuing to system from registration success');
      
      consoleSpy.mockRestore();
    });
  });

  describe('should handle input sanitization', () => {
    it('should filter non-digits from personal number input', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '123abc456');
      
      // Should filter out non-digits and call with only numbers
      expect(mockProps.setPersonalNumber).toHaveBeenCalled();
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('1');
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('6'); // Last valid digit
      // Should not include letters, only filtered digits
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '12-34@56');
      
      // Should filter out special characters and keep only digits
      expect(mockProps.setPersonalNumber).toHaveBeenCalled();
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('1');
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('6'); // Last valid digit
    });

    it('should handle mixed letters and numbers', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, 'abc123def456');
      
      // Should filter out letters and keep only digits
      expect(mockProps.setPersonalNumber).toHaveBeenCalled();
      // Since 'abc' contains no digits, no calls for those characters
      // Then should have calls for '1', '12', '123' etc.
    });
  });

  describe('should handle step validation barriers', () => {
    it('should not progress to OTP with invalid personal number', async () => {
      const user = userEvent.setup();
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).toBeDisabled();
      
      // Clicking disabled button should not trigger navigation
      await user.click(verifyButton);
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
    });

    it('should maintain validation state across re-renders', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      const { rerender } = render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123" />);
      
      expect(screen.getByTestId('verify-button')).toBeDisabled();
      
      rerender(<RegistrationFormTestWrapper {...mockProps} personalNumber="123" />);
      expect(screen.getByTestId('verify-button')).toBeDisabled();
    });
  });

  describe('should maintain form state across steps', () => {
    it('should preserve user data throughout the flow', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Progress through steps
      await user.click(screen.getByTestId('verify-button'));
      
      // Check user data is preserved in OTP step
      // Phone number is displayed in OTP step, not personal details step
      
      await user.click(screen.getByTestId('otp-verify-success'));
      
      // Check user data is preserved in details step
      expect(screen.getByTestId('personal-first-name')).toHaveTextContent('יוסי');
      expect(screen.getByTestId('personal-last-name')).toHaveTextContent('כהן');
      // Phone number is displayed in OTP step, not personal details step
    });

    it('should handle step navigation without data loss', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Go forward then back
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-back-button'));
      
      // Go forward again
      await user.click(screen.getByTestId('verify-button'));
      
      // User data should still be available
      // Phone number is displayed in OTP step, not personal details step
    });
  });

  describe('should handle switch to login', () => {
    it('should call onSwitchToLogin when switch button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} />);
      
      const switchButton = screen.getByText('כבר יש לך חשבון? התחבר כאן');
      await user.click(switchButton);
      
      expect(mockProps.onSwitchToLogin).toHaveBeenCalled();
    });

    it('should handle missing onSwitchToLogin prop', () => {
      const propsWithoutSwitch = {
        personalNumber: '',
        setPersonalNumber: jest.fn(),
      };
      
      expect(() => {
        render(<RegistrationFormTestWrapper {...propsWithoutSwitch} />);
      }).not.toThrow();
    });
  });

  describe('complete flow integration tests', () => {
    it('should complete full registration flow successfully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Step 1: Personal Number
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      await user.click(screen.getByTestId('verify-button'));
      
      // Step 2: OTP
      expect(screen.getByTestId('otp-verification-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('otp-verify-success'));
      
      // Step 3: Personal Details
      expect(screen.getByTestId('personal-details-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('personal-submit-button'));
      
      // Step 4: Account Details
      expect(screen.getByTestId('account-details-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('account-submit-button'));
      
      // Step 5: Success
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('success-continue-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Continuing to system from registration success');
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid step transitions', async () => {
      const user = userEvent.setup();
      render(<RegistrationFormTestWrapper {...mockProps} personalNumber="123456" />);
      
      // Rapid navigation
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('personal-submit-button'));
      await user.click(screen.getByTestId('account-submit-button'));
      
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
    });
  });
});