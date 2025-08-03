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
    },
  },
}));

// Mock child components
jest.mock('../OTPVerificationStep', () => {
  return function MockOTPVerificationStep({ 
    phoneNumber, 
    onVerifySuccess, 
    onBack 
  }: { 
    phoneNumber: string, 
    onVerifySuccess?: () => void, 
    onBack?: () => void 
  }) {
    return (
      <div data-testid="otp-verification-step">
        <div data-testid="otp-phone-number">{phoneNumber}</div>
        <button onClick={onVerifySuccess} data-testid="otp-verify-success">
          Verify OTP Success
        </button>
        <button onClick={onBack} data-testid="otp-back-button">
          Back to Personal Number
        </button>
      </div>
    );
  };
});

jest.mock('../RegistrationDetailsStep', () => {
  return function MockRegistrationDetailsStep({ 
    firstName, 
    lastName, 
    phoneNumber, 
    onSubmit 
  }: { 
    firstName: string, 
    lastName: string, 
    phoneNumber: string, 
    onSubmit?: (data: {
      email: string;
      password: string;
      gender: string;
      birthdate: string;
      consent: boolean;
    }) => void 
  }) {
    return (
      <div data-testid="registration-details-step">
        <div data-testid="details-first-name">{firstName}</div>
        <div data-testid="details-last-name">{lastName}</div>
        <div data-testid="details-phone-number">{phoneNumber}</div>
        <button 
          onClick={() => onSubmit?.({
            email: 'test@example.com',
            password: 'Password123!',
            gender: 'male',
            birthdate: '1990-01-01',
            consent: true,
          })} 
          data-testid="details-submit-button"
        >
          Submit Registration
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

describe('RegistrationForm Multi-Step Flow', () => {
  const mockProps = {
    personalNumber: '',
    setPersonalNumber: jest.fn(),
    onSwitchToLogin: jest.fn(),
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
      render(<RegistrationForm {...mockProps} />);
      
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('verify-button')).toBeInTheDocument();
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('registration-details-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('registration-success-step')).not.toBeInTheDocument();
    });

    it('should display personal number form elements', () => {
      render(<RegistrationForm {...mockProps} />);
      
      expect(screen.getByText('מספר אישי')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('הזן מספר אישי')).toBeInTheDocument();
      expect(screen.getByText('אמת מספר')).toBeInTheDocument();
      expect(screen.getByText('יש לך כבר חשבון? התחבר')).toBeInTheDocument();
    });

    it('should handle personal number input correctly', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '123456');
      
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('123456');
    });
  });

  describe('should show validation error for invalid input', () => {
    it('should display error when personal number is invalid', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי חייב להכיל בין 5-7 ספרות בלבד',
      });

      render(<RegistrationForm {...mockProps} personalNumber="123" />);
      
      expect(screen.getByText('מספר אישי חייב להכיל בין 5-7 ספרות בלבד')).toBeInTheDocument();
    });

    it('should show error with red styling', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationForm {...mockProps} personalNumber="invalid" />);
      
      const input = screen.getByTestId('personal-number-input');
      expect(input).toHaveClass('border-red-500');
    });

    it('should disable verify button for invalid input', () => {
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationForm {...mockProps} personalNumber="123" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('should enable verify button for valid input', () => {
    it('should enable button when personal number is valid', () => {
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      expect(verifyButton).not.toBeDisabled();
      expect(verifyButton).toHaveClass('bg-gradient-to-r', 'from-blue-600');
    });

    it('should not show error message for valid input', () => {
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      expect(screen.queryByTestId('personal-number-error')).not.toBeInTheDocument();
    });

    it('should have proper button styling for valid state', () => {
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      const input = screen.getByTestId('personal-number-input');
      expect(input).toHaveClass('border-green-500');
    });
  });

  describe('should progress to OTP step on verification', () => {
    it('should transition to OTP step when verify button clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('TODO: verify personal number', '123456');
      expect(screen.getByTestId('otp-verification-step')).toBeInTheDocument();
      expect(screen.queryByTestId('personal-number-input')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should pass mock user data to OTP step', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(screen.getByTestId('otp-phone-number')).toHaveTextContent('0521234567');
    });

    it('should show OTP step with back navigation', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      expect(screen.getByTestId('otp-back-button')).toBeInTheDocument();
      expect(screen.getByTestId('otp-verify-success')).toBeInTheDocument();
    });
  });

  describe('should navigate back from OTP step', () => {
    it('should return to personal number step when back button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
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
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
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
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
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
      
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Go to OTP step
      const verifyButton = screen.getByTestId('verify-button');
      await user.click(verifyButton);
      
      // Verify OTP
      const otpVerifyButton = screen.getByTestId('otp-verify-success');
      await user.click(otpVerifyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('OTP verification successful');
      expect(screen.getByTestId('registration-details-step')).toBeInTheDocument();
      expect(screen.queryByTestId('otp-verification-step')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should pass user data to details step', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Navigate to details step
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      
      expect(screen.getByTestId('details-first-name')).toHaveTextContent('יוסי');
      expect(screen.getByTestId('details-last-name')).toHaveTextContent('כהן');
      expect(screen.getByTestId('details-phone-number')).toHaveTextContent('0521234567');
    });
  });

  describe('should progress to success step from details', () => {
    it('should transition to success step after registration completion', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Navigate through all steps
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('details-submit-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Registration complete with data:', {
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male',
        birthdate: '1990-01-01',
        consent: true,
      });
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
      expect(screen.queryByTestId('registration-details-step')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should show success step with continue button', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Navigate to success step
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('details-submit-button'));
      
      expect(screen.getByTestId('success-continue-button')).toBeInTheDocument();
    });

    it('should handle continue from success step', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Navigate to success step and continue
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('details-submit-button'));
      await user.click(screen.getByTestId('success-continue-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Continuing to system from registration success');
      
      consoleSpy.mockRestore();
    });
  });

  describe('should handle input sanitization', () => {
    it('should filter non-digits from personal number input', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '123abc456');
      
      // Should only call setPersonalNumber with digits
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('123456');
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, '12-34@56');
      
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('123456');
    });

    it('should handle mixed letters and numbers', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} />);
      
      const input = screen.getByTestId('personal-number-input');
      await user.type(input, 'abc123def456');
      
      expect(mockProps.setPersonalNumber).toHaveBeenCalledWith('123456');
    });
  });

  describe('should handle step validation barriers', () => {
    it('should not progress to OTP with invalid personal number', async () => {
      const user = userEvent.setup();
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });

      render(<RegistrationForm {...mockProps} personalNumber="123" />);
      
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

      const { rerender } = render(<RegistrationForm {...mockProps} personalNumber="123" />);
      
      expect(screen.getByTestId('verify-button')).toBeDisabled();
      
      rerender(<RegistrationForm {...mockProps} personalNumber="123" />);
      expect(screen.getByTestId('verify-button')).toBeDisabled();
    });
  });

  describe('should maintain form state across steps', () => {
    it('should preserve user data throughout the flow', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Progress through steps
      await user.click(screen.getByTestId('verify-button'));
      
      // Check user data is preserved in OTP step
      expect(screen.getByTestId('otp-phone-number')).toHaveTextContent('0521234567');
      
      await user.click(screen.getByTestId('otp-verify-success'));
      
      // Check user data is preserved in details step
      expect(screen.getByTestId('details-first-name')).toHaveTextContent('יוסי');
      expect(screen.getByTestId('details-last-name')).toHaveTextContent('כהן');
      expect(screen.getByTestId('details-phone-number')).toHaveTextContent('0521234567');
    });

    it('should handle step navigation without data loss', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Go forward then back
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-back-button'));
      
      // Go forward again
      await user.click(screen.getByTestId('verify-button'));
      
      // User data should still be available
      expect(screen.getByTestId('otp-phone-number')).toHaveTextContent('0521234567');
    });
  });

  describe('should handle switch to login', () => {
    it('should call onSwitchToLogin when switch button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} />);
      
      const switchButton = screen.getByText('יש לך כבר חשבון? התחבר');
      await user.click(switchButton);
      
      expect(mockProps.onSwitchToLogin).toHaveBeenCalled();
    });

    it('should handle missing onSwitchToLogin prop', () => {
      const propsWithoutSwitch = {
        personalNumber: '',
        setPersonalNumber: jest.fn(),
      };
      
      expect(() => {
        render(<RegistrationForm {...propsWithoutSwitch} />);
      }).not.toThrow();
    });
  });

  describe('complete flow integration tests', () => {
    it('should complete full registration flow successfully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Step 1: Personal Number
      expect(screen.getByTestId('personal-number-input')).toBeInTheDocument();
      await user.click(screen.getByTestId('verify-button'));
      
      // Step 2: OTP
      expect(screen.getByTestId('otp-verification-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('otp-verify-success'));
      
      // Step 3: Details
      expect(screen.getByTestId('registration-details-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('details-submit-button'));
      
      // Step 4: Success
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
      await user.click(screen.getByTestId('success-continue-button'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Continuing to system from registration success');
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid step transitions', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...mockProps} personalNumber="123456" />);
      
      // Rapid navigation
      await user.click(screen.getByTestId('verify-button'));
      await user.click(screen.getByTestId('otp-verify-success'));
      await user.click(screen.getByTestId('details-submit-button'));
      
      expect(screen.getByTestId('registration-success-step')).toBeInTheDocument();
    });
  });
});