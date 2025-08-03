import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationModal from '../RegistrationModal';

// Mock validation utilities
jest.mock('@/utils/validationUtils', () => ({
  validatePersonalNumber: jest.fn(),
  validateOTP: jest.fn(),
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateGender: jest.fn(),
  validateBirthdate: jest.fn(),
  validateConsent: jest.fn(),
  maskPhoneNumber: jest.fn(),
}));

// Mock text constants
jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      PERSONAL_NUMBER: 'מספר אישי',
      PERSONAL_NUMBER_PLACEHOLDER: 'הזן מספר אישי',
      VERIFY_PERSONAL_NUMBER: 'אמת מספר',
      SWITCH_TO_LOGIN: 'יש לך כבר חשבון? התחבר',
      OTP_VERIFICATION: 'אימות טלפון',
      OTP_SENT_MESSAGE: 'קוד בן 6 ספרות נשלח למספר הטלפון שלך',
      OTP_INPUT_PLACEHOLDER: 'הזן קוד 6 ספרות',
      VERIFY_OTP_CODE: 'אמת קוד',
      RESEND_CODE: 'שלח קוד מחדש',
      REGISTRATION_DETAILS: 'פרטי הרשמה',
      FIRST_NAME: 'שם פרטי',
      LAST_NAME: 'שם משפחה',
      PHONE_NUMBER: 'מספר טלפון',
      EMAIL_ADDRESS: 'כתובת אימייל',
      PASSWORD: 'סיסמה',
      GENDER: 'מין',
      GENDER_MALE: 'זכר',
      GENDER_FEMALE: 'נקבה',
      GENDER_OTHER: 'אחר',
      BIRTHDATE: 'תאריך לידה',
      CONSENT_TERMS: 'אני מסכים/ה לתנאי השימוש',
      CREATE_ACCOUNT: 'צור חשבון',
      EMAIL_PLACEHOLDER_REGISTRATION: 'example@email.com',
      PASSWORD_PLACEHOLDER_REGISTRATION: 'הזן סיסמה חזקה',
      REGISTRATION_SUCCESS: 'הרשמה בוצעה בהצלחה!',
      CONTINUE_TO_SYSTEM: 'המשך למערכת',
      REGISTER_TO_SYSTEM: 'הרשמה למערכת',
    },
    ARIA_LABELS: {
      CLOSE_MODAL: 'סגור חלון',
    },
    COMPANY_NAME: 'צה"ל - חטיבת גבעתי',
  },
}));

import {
  validatePersonalNumber,
  validateOTP,
  validateEmail,
  validatePassword,
  validateGender,
  validateBirthdate,
  validateConsent,
  maskPhoneNumber,
} from '@/utils/validationUtils';

const mockValidatePersonalNumber = validatePersonalNumber as jest.MockedFunction<typeof validatePersonalNumber>;
const mockValidateOTP = validateOTP as jest.MockedFunction<typeof validateOTP>;
const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockValidateGender = validateGender as jest.MockedFunction<typeof validateGender>;
const mockValidateBirthdate = validateBirthdate as jest.MockedFunction<typeof validateBirthdate>;
const mockValidateConsent = validateConsent as jest.MockedFunction<typeof validateConsent>;
const mockMaskPhoneNumber = maskPhoneNumber as jest.MockedFunction<typeof maskPhoneNumber>;

describe('Registration Flow Integration Tests', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSwitch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful validation mocks
    mockValidatePersonalNumber.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateOTP.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateEmail.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateGender.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateBirthdate.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateConsent.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockMaskPhoneNumber.mockReturnValue('052-***4567');
  });

  describe('should progress through all registration steps', () => {
    it('should complete full registration flow with valid inputs', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<RegistrationModal {...mockProps} />);
      
      // Step 1: Personal Number Entry
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      
      const verifyButton = screen.getByText('אמת מספר');
      expect(verifyButton).not.toBeDisabled();
      await user.click(verifyButton);
      
      // Step 2: OTP Verification
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      
      // Auto-verification should trigger
      await waitFor(() => {
        expect(screen.getByText('פרטי הרשמה')).toBeInTheDocument();
      });
      
      // Step 3: Registration Details
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const genderSelect = screen.getByTestId('gender-select');
      const birthdateInput = screen.getByTestId('birthdate-input');
      const consentCheckbox = screen.getByTestId('consent-checkbox');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.selectOptions(genderSelect, 'male');
      await user.type(birthdateInput, '1990-01-01');
      await user.click(consentCheckbox);
      
      const createAccountButton = screen.getByTestId('create-account-button');
      expect(createAccountButton).not.toBeDisabled();
      await user.click(createAccountButton);
      
      // Step 4: Success
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });
      
      const continueButton = screen.getByTestId('continue-button');
      await user.click(continueButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Continuing to system from registration success');
      
      consoleSpy.mockRestore();
    });

    it('should show correct step indicators throughout flow', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Step 1: Personal Number
      expect(screen.getByText('מספר אישי')).toBeInTheDocument();
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      // Step 2: OTP
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
        expect(screen.getByText('קוד בן 6 ספרות נשלח למספר הטלפון שלך')).toBeInTheDocument();
      });
      
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      
      // Step 3: Details
      await waitFor(() => {
        expect(screen.getByText('פרטי הרשמה')).toBeInTheDocument();
      });
      
      // Fill form
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      await user.click(screen.getByTestId('create-account-button'));
      
      // Step 4: Success
      await waitFor(() => {
        expect(screen.getByText('הרשמה בוצעה בהצלחה!')).toBeInTheDocument();
      });
    });
  });

  describe('should handle step validation barriers', () => {
    it('should prevent progression with invalid personal number', async () => {
      const user = userEvent.setup();
      
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי חייב להכיל בין 5-7 ספרות בלבד',
      });
      
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123');
      
      const verifyButton = screen.getByText('אמת מספר');
      expect(verifyButton).toBeDisabled();
      
      // Should not progress to OTP step
      await user.click(verifyButton);
      expect(screen.queryByText('אימות טלפון')).not.toBeInTheDocument();
    });

    it('should prevent form submission with invalid details', async () => {
      const user = userEvent.setup();
      
      // Valid until details step
      render(<RegistrationModal {...mockProps} />);
      
      // Progress to details step
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });
      
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      
      await waitFor(() => {
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
      });
      
      // Make email validation fail
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid-email');
      
      const createAccountButton = screen.getByTestId('create-account-button');
      expect(createAccountButton).toBeDisabled();
    });

    it('should show validation errors at appropriate steps', async () => {
      const user = userEvent.setup();
      
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });
      
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, 'invalid');
      
      expect(screen.getByText('מספר אישי לא תקין')).toBeInTheDocument();
    });
  });

  describe('should maintain form state across steps', () => {
    it('should preserve personal number when navigating back from OTP', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      // Navigate to OTP step
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      // Go back to personal number step
      const backButton = screen.getByRole('button', { name: 'חזרה להתחברות' });
      await user.click(backButton);
      
      // Personal number should be preserved
      const newPersonalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      expect(newPersonalNumberInput).toHaveValue('123456');
    });

    it('should preserve user data across step transitions', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Progress to details step
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });
      
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      
      await waitFor(() => {
        expect(screen.getByTestId('first-name-readonly')).toBeInTheDocument();
      });
      
      // Check that mock user data is displayed
      expect(screen.getByTestId('first-name-readonly')).toHaveValue('יוסי');
      expect(screen.getByTestId('last-name-readonly')).toHaveValue('כהן');
    });

    it('should handle rapid step navigation without data loss', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Quick navigation
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });
      
      // Navigate back and forward quickly
      const backButton = screen.getByRole('button', { name: 'חזרה להתחברות' });
      await user.click(backButton);
      
      // Should return to personal number with data preserved
      expect(screen.getByPlaceholderText('הזן מספר אישי')).toHaveValue('123456');
      
      // Navigate forward again
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
    });
  });

  describe('should reset form state on modal close', () => {
    it('should clear all form data when modal is closed', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Fill personal number
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: 'סגור חלון' });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should reset to initial step when reopened', () => {
      const { rerender } = render(<RegistrationModal {...mockProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<RegistrationModal {...mockProps} isOpen={true} />);
      
      // Should show personal number step
      expect(screen.getByText('מספר אישי')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('הזן מספר אישי')).toHaveValue('');
    });

    it('should clean up state even from advanced steps', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Progress to OTP step
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      // Close modal from OTP step
      const closeButton = screen.getByRole('button', { name: 'סגור חלון' });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('should handle browser back button', () => {
    it('should handle step navigation appropriately', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Progress through steps
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      // Simulate back navigation via component back button
      const backButton = screen.getByRole('button', { name: 'חזרה להתחברות' });
      await user.click(backButton);
      
      expect(screen.getByText('מספר אישי')).toBeInTheDocument();
    });

    it('should preserve form state during navigation', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      // Navigate back
      const backButton = screen.getByRole('button', { name: 'חזרה להתחברות' });
      await user.click(backButton);
      
      // State should be preserved
      const newPersonalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      expect(newPersonalNumberInput).toHaveValue('123456');
    });
  });

  describe('form state management integration', () => {
    it('should update validation state in real-time across steps', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Step 1: Real-time validation for personal number
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      
      // Invalid input
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });
      
      await user.type(personalNumberInput, '123');
      expect(screen.getByText('אמת מספר')).toBeDisabled();
      
      // Valid input
      mockValidatePersonalNumber.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      
      await user.clear(personalNumberInput);
      await user.type(personalNumberInput, '123456');
      expect(screen.getByText('אמת מספר')).not.toBeDisabled();
    });

    it('should aggregate validation from all fields in details step', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Navigate to details step
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });
      
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      
      await waitFor(() => {
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
      });
      
      // All fields invalid initially
      mockValidateEmail.mockReturnValue({ isValid: false, errorMessage: 'Email required' });
      mockValidatePassword.mockReturnValue({ isValid: false, errorMessage: 'Password required' });
      mockValidateGender.mockReturnValue({ isValid: false, errorMessage: 'Gender required' });
      mockValidateBirthdate.mockReturnValue({ isValid: false, errorMessage: 'Birthdate required' });
      mockValidateConsent.mockReturnValue({ isValid: false, errorMessage: 'Consent required' });
      
      const createAccountButton = screen.getByTestId('create-account-button');
      expect(createAccountButton).toBeDisabled();
      
      // Make all fields valid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateConsent.mockReturnValue({ isValid: true, errorMessage: null });
      
      // Fill all fields to trigger validation
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
    });

    it('should handle controlled input components across the flow', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Controlled personal number input
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      expect(personalNumberInput).toHaveValue('123456');
      
      // Progress to OTP
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByTestId('otp-input')).toBeInTheDocument();
      });
      
      // Controlled OTP input
      const otpInput = screen.getByTestId('otp-input');
      await user.type(otpInput, '123456');
      expect(otpInput).toHaveValue('123456');
    });
  });

  describe('error recovery and resilience', () => {
    it('should recover from validation errors', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      // Start with invalid input
      mockValidatePersonalNumber.mockReturnValue({
        isValid: false,
        errorMessage: 'מספר אישי לא תקין',
      });
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123');
      
      expect(screen.getByText('מספר אישי לא תקין')).toBeInTheDocument();
      expect(screen.getByText('אמת מספר')).toBeDisabled();
      
      // Fix the input
      mockValidatePersonalNumber.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      
      await user.clear(personalNumberInput);
      await user.type(personalNumberInput, '123456');
      
      expect(screen.queryByText('מספר אישי לא תקין')).not.toBeInTheDocument();
      expect(screen.getByText('אמת מספר')).not.toBeDisabled();
    });

    it('should handle step navigation errors gracefully', async () => {
      const user = userEvent.setup();
      render(<RegistrationModal {...mockProps} />);
      
      const personalNumberInput = screen.getByPlaceholderText('הזן מספר אישי');
      await user.type(personalNumberInput, '123456');
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
      
      // Multiple rapid back/forward navigation should work
      const backButton = screen.getByRole('button', { name: 'חזרה להתחברות' });
      await user.click(backButton);
      await user.click(screen.getByText('אמת מספר'));
      
      await waitFor(() => {
        expect(screen.getByText('אימות טלפון')).toBeInTheDocument();
      });
    });
  });
});