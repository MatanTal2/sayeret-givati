import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationDetailsStep from '../RegistrationDetailsStep';

// Mock the validation utilities
jest.mock('@/utils/validationUtils', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateGender: jest.fn(),
  validateBirthdate: jest.fn(),
  validateConsent: jest.fn(),
}));

// Mock the text constants
jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
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
    },
  },
}));

import {
  validateEmail,
  validatePassword,
  validateGender,
  validateBirthdate,
  validateConsent,
} from '@/utils/validationUtils';

const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockValidateGender = validateGender as jest.MockedFunction<typeof validateGender>;
const mockValidateBirthdate = validateBirthdate as jest.MockedFunction<typeof validateBirthdate>;
const mockValidateConsent = validateConsent as jest.MockedFunction<typeof validateConsent>;

describe('RegistrationDetailsStep Component', () => {
  const mockProps = {
    firstName: 'יוסי',
    lastName: 'כהן',
    phoneNumber: '0521234567',
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations (all invalid initially)
    mockValidateEmail.mockReturnValue({
      isValid: false,
      errorMessage: 'כתובת אימייל היא שדה חובה',
    });
    mockValidatePassword.mockReturnValue({
      isValid: false,
      errorMessage: 'סיסמה היא שדה חובה',
    });
    mockValidateGender.mockReturnValue({
      isValid: false,
      errorMessage: 'בחירת מין היא שדה חובה',
    });
    mockValidateBirthdate.mockReturnValue({
      isValid: false,
      errorMessage: 'תאריך לידה הוא שדה חובה',
    });
    mockValidateConsent.mockReturnValue({
      isValid: false,
      errorMessage: 'יש לאשר את תנאי השימוש',
    });
  });

  describe('should display pre-filled readonly fields', () => {
    it('should show readonly first name field', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-readonly');
      expect(firstNameInput).toBeInTheDocument();
      expect(firstNameInput).toHaveValue('יוסי');
      expect(firstNameInput).toHaveAttribute('readonly');
    });

    it('should show readonly last name field', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const lastNameInput = screen.getByTestId('last-name-readonly');
      expect(lastNameInput).toBeInTheDocument();
      expect(lastNameInput).toHaveValue('כהן');
      expect(lastNameInput).toHaveAttribute('readonly');
    });



    it('should display readonly fields with proper styling', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-readonly');
      const lastNameInput = screen.getByTestId('last-name-readonly');
      
      expect(firstNameInput).toHaveClass('bg-gray-100', 'cursor-not-allowed');
      expect(lastNameInput).toHaveClass('bg-gray-100', 'cursor-not-allowed');
    });

    it('should handle different prop values', () => {
      const customProps = {
        ...mockProps,
        firstName: 'דוד',
        lastName: 'לוי',
      };
      
      render(<RegistrationDetailsStep {...customProps} />);
      
      expect(screen.getByTestId('first-name-readonly')).toHaveValue('דוד');
      expect(screen.getByTestId('last-name-readonly')).toHaveValue('לוי');
    });
  });

  describe('should validate all fields in real-time', () => {
    it('should validate email on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'test@example.com');
      
      expect(mockValidateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should validate password on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'Password123!');
      
      expect(mockValidatePassword).toHaveBeenCalledWith('Password123!');
    });

    it('should validate gender on selection change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const genderSelect = screen.getByTestId('gender-select');
      await user.selectOptions(genderSelect, 'male');
      
      expect(mockValidateGender).toHaveBeenCalledWith('male');
    });

    it('should validate birthdate on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const birthdateInput = screen.getByTestId('birthdate-input');
      await user.type(birthdateInput, '1990-01-01');
      
      expect(mockValidateBirthdate).toHaveBeenCalledWith('1990-01-01');
    });

    it('should validate consent on checkbox change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const consentCheckbox = screen.getByTestId('consent-checkbox');
      await user.click(consentCheckbox);
      
      expect(mockValidateConsent).toHaveBeenCalledWith(true);
    });

    it('should show validation errors when fields are invalid', async () => {
      const user = userEvent.setup();
      
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid');
      
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByText('כתובת אימייל לא תקינה')).toBeInTheDocument();
    });

    it('should hide validation errors when fields become valid', async () => {
      const user = userEvent.setup();
      
      // Start with invalid
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid');
      
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      
      // Make it valid
      mockValidateEmail.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('should show errors with red border styling', async () => {
      const user = userEvent.setup();
      
      mockValidatePassword.mockReturnValue({
        isValid: false,
        errorMessage: 'סיסמה חלשה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'weak');
      
      expect(passwordInput).toHaveClass('border-red-500');
    });
  });

  describe('should enable submit button only when form valid', () => {
    it('should disable submit button when form is invalid', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const submitButton = screen.getByTestId('create-account-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('bg-gray-300', 'cursor-not-allowed');
    });

    it('should enable submit button when all fields are valid', async () => {
      // Mock all validations as valid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateConsent.mockReturnValue({ isValid: true, errorMessage: null });
      
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Fill all fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      const submitButton = screen.getByTestId('create-account-button');
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-blue-600');
    });

    it('should disable button if even one field is invalid', async () => {
      // Mock most fields as valid but one invalid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateConsent.mockReturnValue({ isValid: false, errorMessage: 'יש לאשר את תנאי השימוש' });
      
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Fill all fields except consent
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      
      const submitButton = screen.getByTestId('create-account-button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('should toggle password visibility', () => {
    it('should start with password field as password type', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility when button clicked', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = passwordInput.nextElementSibling?.querySelector('button');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    it('should show different icons for show/hide states', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = passwordInput.nextElementSibling?.querySelector('button');
      
      if (toggleButton) {
        // Initially shows "show" icon (eye)
        expect(toggleButton.querySelector('svg')).toBeInTheDocument();
        
        await user.click(toggleButton);
        
        // After click shows "hide" icon (eye-slash)
        expect(toggleButton.querySelector('svg')).toBeInTheDocument();
      }
    });

    it('should maintain password value during visibility toggle', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = passwordInput.nextElementSibling?.querySelector('button');
      
      await user.type(passwordInput, 'MyPassword123!');
      expect(passwordInput).toHaveValue('MyPassword123!');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveValue('MyPassword123!');
        
        await user.click(toggleButton);
        expect(passwordInput).toHaveValue('MyPassword123!');
      }
    });
  });

  describe('should handle form submission', () => {
    it('should call onSubmit with form data when form is valid', async () => {
      // Mock all validations as valid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateConsent.mockReturnValue({ isValid: true, errorMessage: null });
      
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Fill all fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      const submitButton = screen.getByTestId('create-account-button');
      await user.click(submitButton);
      
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male',
        birthdate: '1990-01-01',
        consent: true,
      });
    });

    it('should not call onSubmit when form is invalid', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const submitButton = screen.getByTestId('create-account-button');
      await user.click(submitButton);
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should handle missing onSubmit prop gracefully', async () => {
      const propsWithoutSubmit = {
        firstName: 'יוסי',
        lastName: 'כהן',
        phoneNumber: '0521234567',
      };
      
      expect(() => {
        render(<RegistrationDetailsStep {...propsWithoutSubmit} />);
      }).not.toThrow();
    });

    it('should log console message on form submission', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock all validations as valid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      mockValidateConsent.mockReturnValue({ isValid: true, errorMessage: null });
      
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Fill all fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      const submitButton = screen.getByTestId('create-account-button');
      await user.click(submitButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('TODO: register user in Firebase Auth and Firestore');
      
      consoleSpy.mockRestore();
    });
  });

  describe('should update form validation on field changes', () => {
    it('should re-validate all fields when any field changes', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Change email field
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'test@example.com');
      
      // Should validate all fields, not just email
      expect(mockValidateEmail).toHaveBeenCalled();
      expect(mockValidatePassword).toHaveBeenCalled();
      expect(mockValidateGender).toHaveBeenCalled();
      expect(mockValidateBirthdate).toHaveBeenCalled();
      expect(mockValidateConsent).toHaveBeenCalled();
    });

    it('should update button state immediately after field change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const submitButton = screen.getByTestId('create-account-button');
      expect(submitButton).toBeDisabled();
      
      // Mock one field becoming valid
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'test@example.com');
      
      // Button should still be disabled because other fields are invalid
      expect(submitButton).toBeDisabled();
    });

    it('should handle rapid field changes', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      
      // Type rapidly
      await user.type(emailInput, 'abc');
      
      // Validation should be called for each character typed (includes initial state)
      expect(mockValidateEmail).toHaveBeenCalled();
      expect(mockValidateEmail).toHaveBeenCalledWith('abc');
    });
  });

  describe('UI elements and form controls', () => {
    it('should render all required form elements', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Header elements
      expect(screen.getByText('פרטי הרשמה')).toBeInTheDocument();
      
      // Form inputs
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('gender-select')).toBeInTheDocument();
      expect(screen.getByTestId('birthdate-input')).toBeInTheDocument();
      expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('create-account-button')).toBeInTheDocument();
    });

    it('should have proper input attributes', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const birthdateInput = screen.getByTestId('birthdate-input');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'example@email.com');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'הזן סיסמה חזקה');
      
      expect(birthdateInput).toHaveAttribute('type', 'date');
    });

    it('should have proper gender dropdown options', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      
      expect(screen.getByRole('option', { name: 'בחר מין' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'זכר' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'נקבה' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'אחר' })).toBeInTheDocument();
    });

    it('should show error messages only when field has content', async () => {
      const user = userEvent.setup();
      
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // No error shown for empty field
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      
      // Error shown after typing
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid');
      
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });

    it('should handle form reset behavior', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Fill some fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password');
      
      expect(screen.getByTestId('email-input')).toHaveValue('test@example.com');
      expect(screen.getByTestId('password-input')).toHaveValue('password');
      
      // Clear fields
      await user.clear(screen.getByTestId('email-input'));
      await user.clear(screen.getByTestId('password-input'));
      
      expect(screen.getByTestId('email-input')).toHaveValue('');
      expect(screen.getByTestId('password-input')).toHaveValue('');
    });
  });

  describe('error display for all fields', () => {
    it('should show password error when password is invalid', async () => {
      const user = userEvent.setup();
      
      mockValidatePassword.mockReturnValue({
        isValid: false,
        errorMessage: 'סיסמה חלשה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'weak');
      
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
      expect(screen.getByText('סיסמה חלשה')).toBeInTheDocument();
    });

    it('should show gender error when gender is not selected', async () => {
      const user = userEvent.setup();
      
      mockValidateGender.mockReturnValue({
        isValid: false,
        errorMessage: 'בחירת מין היא שדה חובה',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const genderSelect = screen.getByTestId('gender-select');
      await user.selectOptions(genderSelect, '');
      
      expect(screen.getByTestId('gender-error')).toBeInTheDocument();
      expect(screen.getByText('בחירת מין היא שדה חובה')).toBeInTheDocument();
    });

    it('should show birthdate error when birthdate is invalid', async () => {
      const user = userEvent.setup();
      
      mockValidateBirthdate.mockReturnValue({
        isValid: false,
        errorMessage: 'תאריך לידה לא תקין',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      const birthdateInput = screen.getByTestId('birthdate-input');
      await user.type(birthdateInput, '2025-01-01');
      
      expect(screen.getByTestId('birthdate-error')).toBeInTheDocument();
      expect(screen.getByText('תאריך לידה לא תקין')).toBeInTheDocument();
    });

    it('should show consent error when consent is not accepted', async () => {
      const user = userEvent.setup();
      
      mockValidateConsent.mockReturnValue({
        isValid: false,
        errorMessage: 'יש לאשר את תנאי השימוש',
      });
      
      render(<RegistrationDetailsStep {...mockProps} />);
      
      // Trigger validation by attempting to check and uncheck
      const consentCheckbox = screen.getByTestId('consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(consentCheckbox);
      
      expect(screen.getByTestId('consent-error')).toBeInTheDocument();
      expect(screen.getByText('יש לאשר את תנאי השימוש')).toBeInTheDocument();
    });
  });
});