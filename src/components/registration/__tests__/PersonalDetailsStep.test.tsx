import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonalDetailsStep from '../PersonalDetailsStep';
import { selectListboxOption, listboxButtonLabel } from '@/__test-utils__/listboxHelpers';

jest.mock('@/utils/validationUtils', () => ({
  validateHebrewName: jest.fn(),
  validateGender: jest.fn(),
  validateBirthdate: jest.fn(),
}));

jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      GENDER: 'מין',
      GENDER_MALE: 'זכר',
      GENDER_FEMALE: 'נקבה',
      GENDER_OTHER: 'אחר',
      BIRTHDATE: 'תאריך לידה',
      BIRTHDATE_PLACEHOLDER: 'בחר תאריך לידה',
    },
    REGISTRATION_COMPONENTS: {
      ENTER_FIRST_NAME: 'הזן שם פרטי',
      ENTER_LAST_NAME: 'הזן שם משפחה',
    },
  },
}));

import { validateHebrewName, validateGender, validateBirthdate } from '@/utils/validationUtils';

const mockValidateHebrewName = validateHebrewName as jest.MockedFunction<typeof validateHebrewName>;
const mockValidateGender = validateGender as jest.MockedFunction<typeof validateGender>;
const mockValidateBirthdate = validateBirthdate as jest.MockedFunction<typeof validateBirthdate>;

const GENDER_LABEL = 'מין';
const GENDER_MALE_LABEL = 'זכר';

describe('PersonalDetailsStep', () => {
  const defaultProps = {
    firstName: 'יוסי',
    lastName: 'כהן',
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateHebrewName.mockReturnValue({ isValid: true, errorMessage: null });
    mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
    mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
  });

  describe('Component Rendering', () => {
    it('renders the personal details form', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      expect(screen.getByText('פרטים אישיים')).toBeInTheDocument();
      expect(screen.getByText('השלם את הפרטים האישיים שלך')).toBeInTheDocument();
      expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: GENDER_LABEL })).toBeInTheDocument();
      expect(screen.getByTestId('birthdate-input')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('renders with the supplied initial first/last name', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      expect(screen.getByTestId('first-name-input')).toHaveValue('יוסי');
      expect(screen.getByTestId('last-name-input')).toHaveValue('כהן');
    });

    it('renders preserved form data when gender + birthdate are passed in', () => {
      render(
        <PersonalDetailsStep {...defaultProps} gender="male" birthdate="1990-01-01" />,
      );
      expect(screen.getByTestId('first-name-input')).toHaveValue('יוסי');
      expect(screen.getByTestId('last-name-input')).toHaveValue('כהן');
      expect(listboxButtonLabel(GENDER_LABEL)).toBe(GENDER_MALE_LABEL);
      expect(screen.getByTestId('birthdate-input')).toHaveValue('1990-01-01');
    });
  });

  describe('Form Input Handling', () => {
    it('updates the first-name input', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'משה');
      expect(input).toHaveValue('משה');
    });

    it('updates the last-name input', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('last-name-input');
      await user.clear(input);
      await user.type(input, 'לוי');
      expect(input).toHaveValue('לוי');
    });

    it('selects a gender via the Listbox', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      expect(listboxButtonLabel(GENDER_LABEL)).toBe(GENDER_MALE_LABEL);
    });

    it('updates the birthdate input', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('birthdate-input');
      await user.type(input, '1990-01-01');
      expect(input).toHaveValue('1990-01-01');
    });
  });

  describe('Form Validation', () => {
    it('shows the first-name validation error', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'John');
      await waitFor(() => {
        expect(screen.getByTestId('first-name-error')).toHaveTextContent('שם פרטי חייב להיות בעברית');
      });
      expect(input).toHaveClass('border-danger-500');
    });

    it('shows the last-name validation error', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם משפחה חייב להיות בעברית',
      });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('last-name-input');
      await user.clear(input);
      await user.type(input, 'Smith');
      await waitFor(() => {
        expect(screen.getByTestId('last-name-error')).toHaveTextContent('שם משפחה חייב להיות בעברית');
      });
      expect(input).toHaveClass('border-danger-500');
    });

    it('shows the gender validation error after a selection is made', async () => {
      mockValidateGender.mockReturnValue({ isValid: false, errorMessage: 'ערך לא חוקי' });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await waitFor(() => {
        expect(screen.getByTestId('gender-error')).toHaveTextContent('ערך לא חוקי');
      });
    });

    it('shows the birthdate validation error', async () => {
      mockValidateBirthdate.mockReturnValue({
        isValid: false,
        errorMessage: 'תאריך לידה לא תקין',
      });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('birthdate-input');
      await user.type(input, '2030-01-01');
      await waitFor(() => {
        expect(screen.getByTestId('birthdate-error')).toHaveTextContent('תאריך לידה לא תקין');
      });
      expect(input).toHaveClass('border-danger-500');
    });

    it('hides the error once a field becomes valid', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'John');
      await waitFor(() => {
        expect(screen.getByTestId('first-name-error')).toBeInTheDocument();
      });
      mockValidateHebrewName.mockReturnValue({ isValid: true, errorMessage: null });
      await user.clear(input);
      await user.type(input, 'משה');
      await waitFor(() => {
        expect(screen.queryByTestId('first-name-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('enables continue when every field is valid', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      await user.clear(screen.getByTestId('first-name-input'));
      await user.type(screen.getByTestId('first-name-input'), 'משה');
      await user.clear(screen.getByTestId('last-name-input'));
      await user.type(screen.getByTestId('last-name-input'), 'לוי');
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
    });

    it('keeps continue disabled when a field is invalid', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'John');
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeDisabled();
      });
    });

    it('calls onSubmit with the gathered values', async () => {
      const onSubmit = jest.fn();
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} onSubmit={onSubmit} />);
      await user.clear(screen.getByTestId('first-name-input'));
      await user.type(screen.getByTestId('first-name-input'), 'משה');
      await user.clear(screen.getByTestId('last-name-input'));
      await user.type(screen.getByTestId('last-name-input'), 'לוי');
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
      await user.click(screen.getByTestId('continue-button'));
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'משה',
        lastName: 'לוי',
        gender: 'male',
        birthdate: '1990-01-01',
      });
    });

    it('does not call onSubmit when the form is invalid', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });
      const onSubmit = jest.fn();
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} onSubmit={onSubmit} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'John');
      expect(screen.getByTestId('continue-button')).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Validation', () => {
    it('runs the Hebrew-name validator on every keystroke', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'מ');
      await waitFor(() => {
        expect(mockValidateHebrewName).toHaveBeenCalledWith('מ');
      });
      await user.type(input, 'שה');
      await waitFor(() => {
        expect(mockValidateHebrewName).toHaveBeenCalledWith('משה');
      });
    });

    it('flips the submit button to enabled as the last required field becomes valid', async () => {
      mockValidateGender.mockReturnValue({ isValid: false, errorMessage: 'יש לבחור מין' });
      mockValidateBirthdate.mockReturnValue({ isValid: false, errorMessage: 'יש להזין תאריך לידה' });
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      expect(screen.getByTestId('continue-button')).toBeDisabled();

      mockValidateGender.mockReturnValue({ isValid: true, errorMessage: null });
      await selectListboxOption(user, GENDER_LABEL, GENDER_MALE_LABEL);
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeDisabled();
      });

      mockValidateBirthdate.mockReturnValue({ isValid: true, errorMessage: null });
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('does not throw when onSubmit is omitted', () => {
      expect(() => {
        render(<PersonalDetailsStep firstName="יוסי" lastName="כהן" />);
      }).not.toThrow();
    });

    it('handles empty initial values', () => {
      render(<PersonalDetailsStep firstName="" lastName="" />);
      expect(screen.getByTestId('first-name-input')).toHaveValue('');
      expect(screen.getByTestId('last-name-input')).toHaveValue('');
      expect(listboxButtonLabel(GENDER_LABEL)).toBe('בחר מין');
      expect(screen.getByTestId('birthdate-input')).toHaveValue('');
    });

    it('accepts rapid input', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      const input = screen.getByTestId('first-name-input');
      await user.clear(input);
      await user.type(input, 'אבגדהוזחטיכלמנסעפצקרשת');
      await waitFor(() => {
        expect(input).toHaveValue('אבגדהוזחטיכלמנסעפצקרשת');
      });
    });
  });
});
