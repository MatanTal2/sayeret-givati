import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AccountDetailsStep from '../AccountDetailsStep';

// Mock validation utilities
jest.mock('@/utils/validationUtils', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateConsent: jest.fn(),
}));

import { validateEmail, validatePassword, validateConsent } from '@/utils/validationUtils';

const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockValidateConsent = validateConsent as jest.MockedFunction<typeof validateConsent>;

describe('AccountDetailsStep', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks: all validations pass
    mockValidateEmail.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
    mockValidateConsent.mockReturnValue({
      isValid: true,
      errorMessage: null,
    });
  });

  describe('Component Rendering', () => {
    it('should render account details form', () => {
      render(<AccountDetailsStep {...defaultProps} />);
      
      expect(screen.getByText('יצירת חשבון')).toBeInTheDocument();
      expect(screen.getByText('הגדר את פרטי הכניסה שלך')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('create-account-button')).toBeInTheDocument();
    });

    it('should render without labels for email and password', () => {
      render(<AccountDetailsStep {...defaultProps} />);
      
      // Should not have visible labels (placeholders instead)
      expect(screen.queryByText('אימייל')).not.toBeInTheDocument();
      expect(screen.queryByText('סיסמה')).not.toBeInTheDocument();
      
      // Should have placeholders
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('הזן סיסמה חזקה')).toBeInTheDocument();
    });

    it('should render with initial values', () => {
      render(
        <AccountDetailsStep 
          {...defaultProps} 
          email="test@example.com"
          password="Password123!"
          consent={true}
        />
      );
      
      expect(screen.getByTestId('email-input')).toHaveValue('test@example.com');
      expect(screen.getByTestId('password-input')).toHaveValue('Password123!');
      expect(screen.getByTestId('consent-checkbox')).toBeChecked();
    });
  });

  describe('Email Field', () => {
    it('should handle email input changes', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'user@example.com');
      
      expect(emailInput).toHaveValue('user@example.com');
    });

    it('should show email validation error', async () => {
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('כתובת אימייל לא תקינה');
      });
      
      expect(emailInput).toHaveClass('border-red-500');
    });

    it('should have @ icon positioned on the right', () => {
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailContainer = screen.getByTestId('email-input').parentElement;
      const atIcon = emailContainer?.querySelector('svg');
      
      expect(atIcon).toBeInTheDocument();
      expect(atIcon?.parentElement).toHaveClass('absolute', 'right-3');
    });
  });

  describe('Password Field', () => {
    it('should handle password input changes', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'MyPassword123!');
      
      expect(passwordInput).toHaveValue('MyPassword123!');
    });

    it('should show password validation error', async () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        errorMessage: 'סיסמה חייבת להכיל לפחות 8 תווים',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, '123');
      
      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('סיסמה חייבת להכיל לפחות 8 תווים');
      });
      
      expect(passwordInput).toHaveClass('border-red-500');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = screen.getByTestId('password-toggle');
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle again to hide password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have correct icon positioning (lock right, eye left)', () => {
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3');
      const eyeIconContainer = passwordContainer?.querySelector('.absolute.left-3');
      
      expect(lockIconContainer).toBeInTheDocument();
      expect(eyeIconContainer).toBeInTheDocument();
      expect(eyeIconContainer).toContainElement(screen.getByTestId('password-toggle'));
    });
  });

  describe('Password Tooltip', () => {
    it('should show tooltip on lock icon hover', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3 .relative');
      
      // Hover over lock icon container
      await user.hover(lockIconContainer as Element);
      
      await waitFor(() => {
        expect(screen.getByText('דרישות סיסמה:')).toBeInTheDocument();
      });
      
      // Check tooltip content
      expect(screen.getByText(/לפחות 8 תווים/)).toBeInTheDocument();
      expect(screen.getByText(/אות גדולה \(A-Z\)/)).toBeInTheDocument();
      expect(screen.getByText(/אות קטנה \(a-z\)/)).toBeInTheDocument();
      expect(screen.getByText(/מספר \(0-9\)/)).toBeInTheDocument();
      expect(screen.getByText(/תו מיוחד \(!@#\$%\^&\*\)/)).toBeInTheDocument();
    });

    it('should hide tooltip when mouse leaves lock icon', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3 .relative');
      
      // Hover to show tooltip
      await user.hover(lockIconContainer as Element);
      
      await waitFor(() => {
        expect(screen.getByText('דרישות סיסמה:')).toBeInTheDocument();
      });
      
      // Move mouse away to hide tooltip
      await user.unhover(lockIconContainer as Element);
      
      await waitFor(() => {
        expect(screen.queryByText('דרישות סיסמה:')).not.toBeInTheDocument();
      });
    });

    it('should position tooltip correctly', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3 .relative');
      await user.hover(lockIconContainer as Element);
      
      await waitFor(() => {
        const tooltipContainer = screen.getByText('דרישות סיסמה:').parentElement;
        expect(tooltipContainer).toHaveClass('absolute', 'bottom-full', 'right-0', 'mb-2');
      });
    });

    it('should have proper tooltip styling', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3 .relative');
      await user.hover(lockIconContainer as Element);
      
      await waitFor(() => {
        const tooltipContainer = screen.getByText('דרישות סיסמה:').parentElement;
        expect(tooltipContainer).toHaveClass(
          'bg-gray-800',
          'text-white',
          'text-xs',
          'rounded-lg',
          'p-3'
        );
      });
    });
  });

  describe('Consent Checkbox', () => {
    it('should handle consent checkbox changes', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const consentCheckbox = screen.getByTestId('consent-checkbox');
      
      // Initially unchecked
      expect(consentCheckbox).not.toBeChecked();
      
      // Click to check
      await user.click(consentCheckbox);
      expect(consentCheckbox).toBeChecked();
      
      // Click to uncheck
      await user.click(consentCheckbox);
      expect(consentCheckbox).not.toBeChecked();
    });

    it('should show consent validation styling when invalid', async () => {
      mockValidateConsent.mockReturnValue({
        isValid: false,
        errorMessage: 'יש לאשר את תנאי השימוש',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const consentCheckbox = screen.getByTestId('consent-checkbox');
      
      // Click and unclick to trigger validation
      await user.click(consentCheckbox);
      await user.click(consentCheckbox);
      
      await waitFor(() => {
        expect(consentCheckbox).toHaveClass('border-red-500');
      });
    });

    it('should display consent text', () => {
      render(<AccountDetailsStep {...defaultProps} />);
      
      const consentLabel = screen.getByLabelText(/אני מסכים/);
      expect(consentLabel).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should enable create account button when form is valid', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      // Fill all required fields
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
      });
    });

    it('should disable create account button when form is invalid', async () => {
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).toBeDisabled();
      });
    });

    it('should hide error messages when field becomes valid', async () => {
      // Start with invalid email
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid');
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Now make it valid
      mockValidateEmail.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when create account button clicked', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<AccountDetailsStep {...defaultProps} onSubmit={mockOnSubmit} />);
      
      // Fill all fields
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
      });
      
      await user.click(screen.getByTestId('create-account-button'));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!',
        consent: true,
      });
    });

    it('should not call onSubmit when form is invalid', async () => {
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'כתובת אימייל לא תקינה',
      });

      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<AccountDetailsStep {...defaultProps} onSubmit={mockOnSubmit} />);
      
      await user.type(screen.getByTestId('email-input'), 'invalid');
      
      // Try to click create account button (should be disabled)
      const createButton = screen.getByTestId('create-account-button');
      expect(createButton).toBeDisabled();
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Validation', () => {
    it('should validate fields in real-time as user types', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      
      // Type each character
      await user.type(emailInput, 'a');
      
      await waitFor(() => {
        expect(mockValidateEmail).toHaveBeenCalledWith('a');
      });
      
      await user.type(emailInput, '@test.com');
      
      await waitFor(() => {
        expect(mockValidateEmail).toHaveBeenCalledWith('a@test.com');
      });
    });

    it('should update form validity when any field changes', async () => {
      // Mock validation to start with invalid fields
      mockValidateEmail.mockReturnValue({
        isValid: false,
        errorMessage: 'יש להזין אימייל',
      });
      mockValidatePassword.mockReturnValue({
        isValid: false,
        errorMessage: 'יש להזין סיסמה',
      });
      mockValidateConsent.mockReturnValue({
        isValid: false,
        errorMessage: 'יש לאשר את תנאי השימוש',
      });

      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      // Initially form should be invalid (empty required fields)
      expect(screen.getByTestId('create-account-button')).toBeDisabled();
      
      // Fill email and make it valid
      mockValidateEmail.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      
      // Still invalid (password and consent missing)
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).toBeDisabled();
      });
      
      // Fill password and make it valid
      mockValidatePassword.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      
      // Still invalid (consent missing)
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).toBeDisabled();
      });
      
      // Check consent and make it valid
      mockValidateConsent.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      await user.click(screen.getByTestId('consent-checkbox'));
      
      // Now should be valid
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSubmit prop gracefully', () => {
      expect(() => {
        render(<AccountDetailsStep />);
      }).not.toThrow();
    });

    it('should handle empty initial values', () => {
      render(<AccountDetailsStep />);
      
      expect(screen.getByTestId('email-input')).toHaveValue('');
      expect(screen.getByTestId('password-input')).toHaveValue('');
      expect(screen.getByTestId('consent-checkbox')).not.toBeChecked();
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      
      // Rapid typing
      await user.type(emailInput, 'verylongemailaddress@example.com', { delay: 1 });
      
      await waitFor(() => {
        expect(emailInput).toHaveValue('verylongemailaddress@example.com');
      });
    });

    it('should handle multiple password toggle clicks', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = screen.getByTestId('password-toggle');
      
      // Multiple rapid clicks
      for (let i = 0; i < 5; i++) {
        await user.click(toggleButton);
      }
      
      // Should end up visible (odd number of clicks)
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('should handle tooltip interaction during form submission', async () => {
      const user = userEvent.setup();
      render(<AccountDetailsStep {...defaultProps} />);
      
      const passwordContainer = screen.getByTestId('password-input').parentElement;
      const lockIconContainer = passwordContainer?.querySelector('.absolute.right-3 .relative');
      
      // Show tooltip
      await user.hover(lockIconContainer as Element);
      
      await waitFor(() => {
        expect(screen.getByText('דרישות סיסמה:')).toBeInTheDocument();
      });
      
      // Fill form while tooltip is visible
      await user.type(screen.getByTestId('email-input'), 'user@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await user.click(screen.getByTestId('consent-checkbox'));
      
      // Hide tooltip
      await user.unhover(lockIconContainer as Element);
      
      await waitFor(() => {
        expect(screen.queryByText('דרישות סיסמה:')).not.toBeInTheDocument();
      });
    });
  });
});