import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegistrationDetailsStep from '../RegistrationDetailsStep';
import { selectListboxOption } from '@/__test-utils__/listboxHelpers';

jest.mock('@/utils/validationUtils', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateGender: jest.fn(),
  validateBirthdate: jest.fn(),
  validateConsent: jest.fn(),
}));

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
      SYSTEM_POLICY_TITLE: 'תנאי השימוש ומדיניות הפרטיות',
      SYSTEM_POLICY_CONTENT: 'תוכן מדיניות הפרטיות...',
    },
    CONFIRMATIONS: {
      OK: 'אישור',
      CLOSE: 'סגור',
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

const GENDER_LABEL = 'מין';
const GENDER_MALE_LABEL = 'זכר';

const allValid = () => {
  mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
  mockValidatePassword.mockReturnValue({ isValid: true, errorMessage: null });
  mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
  mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
  mockValidateConsent.mockReturnValue({ isValid: true, errorMessage: null });
};

describe('RegistrationDetailsStep Component', () => {
  const mockProps = {
    firstName: 'יוסי',
    lastName: 'כהן',
    phoneNumber: '0521234567',
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateEmail.mockReturnValue({ isValid: false, errorMessage: 'כתובת אימייל היא שדה חובה' });
    mockValidatePassword.mockReturnValue({ isValid: false, errorMessage: 'סיסמה היא שדה חובה' });
    mockValidateGender.mockReturnValue({ isValid: false, errorMessage: 'בחירת מין היא שדה חובה' });
    mockValidateBirthdate.mockReturnValue({ isValid: false, errorMessage: 'תאריך לידה הוא שדה חובה' });
    mockValidateConsent.mockReturnValue({ isValid: false, errorMessage: 'יש לאשר את תנאי השימוש' });
  });

  describe('readonly pre-filled fields', () => {
    it('renders first name readonly with the supplied value', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('first-name-readonly');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('יוסי');
      expect(input).toHaveAttribute('readonly');
    });

    it('renders last name readonly with the supplied value', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('last-name-readonly');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('כהן');
      expect(input).toHaveAttribute('readonly');
    });

    it('honours different prop values', () => {
      render(
        <RegistrationDetailsStep {...mockProps} firstName="דוד" lastName="לוי" />,
      );
      expect(screen.getByTestId('first-name-readonly')).toHaveValue('דוד');
      expect(screen.getByTestId('last-name-readonly')).toHaveValue('לוי');
    });
  });

  describe('real-time validation', () => {
    it('validates email on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      expect(mockValidateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('validates password on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      expect(mockValidatePassword).toHaveBeenCalledWith('Password123!');
    });

    it('validates gender on Listbox selection', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      expect(mockValidateGender).toHaveBeenCalledWith('male');
    });

    it('validates birthdate on input change', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      expect(mockValidateBirthdate).toHaveBeenCalledWith('1990-01-01');
    });

    it('validates consent on checkbox click', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.click(screen.getByTestId('consent-checkbox'));
      expect(mockValidateConsent).toHaveBeenCalledWith(true);
    });

    it('shows the email error when validation fails', async () => {
      mockValidateEmail.mockReturnValue({ isValid: false, errorMessage: 'כתובת אימייל לא תקינה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('email-input'), 'invalid');
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByText('כתובת אימייל לא תקינה')).toBeInTheDocument();
    });

    it('hides the email error once the field becomes valid', async () => {
      mockValidateEmail.mockReturnValue({ isValid: false, errorMessage: 'כתובת אימייל לא תקינה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('email-input');
      await user.type(input, 'invalid');
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      mockValidateEmail.mockReturnValue({ isValid: true, errorMessage: null });
      await user.clear(input);
      await user.type(input, 'valid@example.com');
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('paints the password input with the danger-border class on error', async () => {
      mockValidatePassword.mockReturnValue({ isValid: false, errorMessage: 'סיסמה חלשה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('password-input');
      await user.type(input, 'weak');
      expect(input).toHaveClass('border-danger-500');
    });
  });

  describe('submit button enablement', () => {
    it('disables submit when the form is invalid', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      expect(screen.getByTestId('create-account-button')).toBeDisabled();
    });

    it('enables submit once every validator passes', async () => {
      allValid();
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
      });
    });

    it('keeps submit disabled when any single validator fails', async () => {
      allValid();
      mockValidateConsent.mockReturnValue({ isValid: false, errorMessage: 'יש לאשר את תנאי השימוש' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      expect(screen.getByTestId('create-account-button')).toBeDisabled();
    });
  });

  describe('password visibility toggle', () => {
    it('starts in password mode', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    });

    it('toggles between password and text on toggle click', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('password-input');
      const toggle = input.nextElementSibling as HTMLButtonElement | null;
      expect(toggle).toBeTruthy();
      await user.click(toggle as HTMLButtonElement);
      expect(input).toHaveAttribute('type', 'text');
      await user.click(toggle as HTMLButtonElement);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('preserves password value across visibility toggles', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      const input = screen.getByTestId('password-input');
      const toggle = input.nextElementSibling as HTMLButtonElement | null;
      await user.type(input, 'MyPassword123!');
      expect(input).toHaveValue('MyPassword123!');
      await user.click(toggle as HTMLButtonElement);
      expect(input).toHaveValue('MyPassword123!');
      await user.click(toggle as HTMLButtonElement);
      expect(input).toHaveValue('MyPassword123!');
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with the gathered values when valid', async () => {
      allValid();
      const onSubmit = jest.fn();
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} onSubmit={onSubmit} />);
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Password123!');
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await user.click(screen.getByTestId('consent-checkbox'));
      await waitFor(() => {
        expect(screen.getByTestId('create-account-button')).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('create-account-button'));
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male',
        birthdate: '1990-01-01',
        consent: true,
      });
    });

    it('does not call onSubmit when the form is invalid', async () => {
      const onSubmit = jest.fn();
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} onSubmit={onSubmit} />);
      await user.click(screen.getByTestId('create-account-button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not throw when onSubmit is omitted', () => {
      const propsWithoutSubmit = {
        firstName: 'יוסי',
        lastName: 'כהן',
        phoneNumber: '0521234567',
      };
      expect(() => {
        render(<RegistrationDetailsStep {...propsWithoutSubmit} />);
      }).not.toThrow();
    });
  });

  describe('rendering + UI', () => {
    it('renders the heading + every interactive element', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      expect(screen.getByText('פרטי הרשמה')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: GENDER_LABEL })).toBeInTheDocument();
      expect(screen.getByTestId('birthdate-input')).toBeInTheDocument();
      expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('create-account-button')).toBeInTheDocument();
    });

    it('sets the right input types + placeholders', () => {
      render(<RegistrationDetailsStep {...mockProps} />);
      const email = screen.getByTestId('email-input');
      const password = screen.getByTestId('password-input');
      const birthdate = screen.getByTestId('birthdate-input');
      expect(email).toHaveAttribute('type', 'email');
      expect(email).toHaveAttribute('placeholder', 'example@email.com');
      expect(password).toHaveAttribute('type', 'password');
      expect(password).toHaveAttribute('placeholder', 'הזן סיסמה חזקה');
      expect(birthdate).toHaveAttribute('type', 'date');
    });

    it('reveals the gender options after opening the Listbox', async () => {
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.click(screen.getByRole('button', { name: GENDER_LABEL }));
      expect(await screen.findByRole('option', { name: 'זכר' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'נקבה' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'אחר' })).toBeInTheDocument();
    });

    it('does not show the email error until the field has content', async () => {
      mockValidateEmail.mockReturnValue({ isValid: false, errorMessage: 'כתובת אימייל לא תקינה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      await user.type(screen.getByTestId('email-input'), 'invalid');
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows the password error when invalid', async () => {
      mockValidatePassword.mockReturnValue({ isValid: false, errorMessage: 'סיסמה חלשה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('password-input'), 'weak');
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
      expect(screen.getByText('סיסמה חלשה')).toBeInTheDocument();
    });

    it('shows the gender error after a Listbox selection that the validator rejects', async () => {
      mockValidateGender.mockReturnValue({ isValid: false, errorMessage: 'בחירת מין היא שדה חובה' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      expect(screen.getByTestId('gender-error')).toBeInTheDocument();
      expect(screen.getByText('בחירת מין היא שדה חובה')).toBeInTheDocument();
    });

    it('shows the birthdate error when invalid', async () => {
      mockValidateBirthdate.mockReturnValue({ isValid: false, errorMessage: 'תאריך לידה לא תקין' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      await user.type(screen.getByTestId('birthdate-input'), '2025-01-01');
      expect(screen.getByTestId('birthdate-error')).toBeInTheDocument();
      expect(screen.getByText('תאריך לידה לא תקין')).toBeInTheDocument();
    });

    it('shows the consent error after the checkbox has been touched', async () => {
      mockValidateConsent.mockReturnValue({ isValid: false, errorMessage: 'יש לאשר את תנאי השימוש' });
      const user = userEvent.setup();
      render(<RegistrationDetailsStep {...mockProps} />);
      const checkbox = screen.getByTestId('consent-checkbox');
      await user.click(checkbox);
      await user.click(checkbox);
      expect(screen.getByTestId('consent-error')).toBeInTheDocument();
      expect(screen.getByText('יש לאשר את תנאי השימוש')).toBeInTheDocument();
    });
  });
});
