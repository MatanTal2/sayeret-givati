import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonalDetailsStep from '../PersonalDetailsStep';

// Mock validation utilities
jest.mock('@/utils/validationUtils', () => ({
  validateHebrewName: jest.fn(),
  validateGender: jest.fn(),
  validateBirthdate: jest.fn(),
}));

// Mock text constants
jest.mock('@/constants/text', () => ({
  TEXT_CONSTANTS: {
    AUTH: {
      GENDER_MALE: 'זכר',
      GENDER_FEMALE: 'נקבה',
      GENDER_OTHER: 'אחר',
    },
  },
}));

import { validateHebrewName, validateGender, validateBirthdate } from '@/utils/validationUtils';

const mockValidateHebrewName = validateHebrewName as jest.MockedFunction<typeof validateHebrewName>;
const mockValidateGender = validateGender as jest.MockedFunction<typeof validateGender>;
const mockValidateBirthdate = validateBirthdate as jest.MockedFunction<typeof validateBirthdate>;

describe('PersonalDetailsStep', () => {
  const defaultProps = {
    firstName: 'יוסי',
    lastName: 'כהן',
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks: all validations pass
    mockValidateHebrewName.mockReturnValue({
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
  });

  describe('Component Rendering', () => {
    it('should render personal details form', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      
      expect(screen.getByText('פרטים אישיים')).toBeInTheDocument();
      expect(screen.getByText('השלם את הפרטים האישיים שלך')).toBeInTheDocument();
      expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('gender-select')).toBeInTheDocument();
      expect(screen.getByTestId('birthdate-input')).toBeInTheDocument();
      expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('should render with initial values', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      
      expect(screen.getByTestId('first-name-input')).toHaveValue('יוסי');
      expect(screen.getByTestId('last-name-input')).toHaveValue('כהן');
      expect(screen.getByTestId('gender-select')).toHaveValue('');
      expect(screen.getByTestId('birthdate-input')).toHaveValue('');
    });

    it('should render with preserved form data', () => {
      render(
        <PersonalDetailsStep 
          {...defaultProps} 
          gender="male"
          birthdate="1990-01-01"
        />
      );
      
      expect(screen.getByTestId('first-name-input')).toHaveValue('יוסי');
      expect(screen.getByTestId('last-name-input')).toHaveValue('כהן');
      expect(screen.getByTestId('gender-select')).toHaveValue('male');
      expect(screen.getByTestId('birthdate-input')).toHaveValue('1990-01-01');
    });
  });

  describe('Form Input Handling', () => {
    it('should handle first name input changes', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'משה');
      
      expect(firstNameInput).toHaveValue('משה');
    });

    it('should handle last name input changes', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const lastNameInput = screen.getByTestId('last-name-input');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'לוי');
      
      expect(lastNameInput).toHaveValue('לוי');
    });

    it('should handle gender selection', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const genderSelect = screen.getByTestId('gender-select');
      await user.selectOptions(genderSelect, 'male');
      
      expect(genderSelect).toHaveValue('male');
    });

    it('should handle birthdate input', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const birthdateInput = screen.getByTestId('birthdate-input');
      await user.type(birthdateInput, '1990-01-01');
      
      expect(birthdateInput).toHaveValue('1990-01-01');
    });
  });

  describe('Form Validation', () => {
    it('should show first name validation error', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'John');
      
      await waitFor(() => {
        expect(screen.getByTestId('first-name-error')).toHaveTextContent('שם פרטי חייב להיות בעברית');
      });
      
      expect(firstNameInput).toHaveClass('border-red-500');
    });

    it('should show last name validation error', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם משפחה חייב להיות בעברית',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const lastNameInput = screen.getByTestId('last-name-input');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Smith');
      
      await waitFor(() => {
        expect(screen.getByTestId('last-name-error')).toHaveTextContent('שם משפחה חייב להיות בעברית');
      });
      
      expect(lastNameInput).toHaveClass('border-red-500');
    });

    it('should show gender validation error', async () => {
      mockValidateGender.mockReturnValue({
        isValid: false,
        errorMessage: 'ערך לא חוקי',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const genderSelect = screen.getByTestId('gender-select');
      
      // Select an invalid value (mock will return error for any value)
      await user.selectOptions(genderSelect, 'male');
      
      await waitFor(() => {
        expect(screen.getByTestId('gender-error')).toHaveTextContent('ערך לא חוקי');
      });
      
      expect(genderSelect).toHaveClass('border-red-500');
    });

    it('should show birthdate validation error', async () => {
      mockValidateBirthdate.mockReturnValue({
        isValid: false,
        errorMessage: 'תאריך לידה לא תקין',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const birthdateInput = screen.getByTestId('birthdate-input');
      await user.type(birthdateInput, '2030-01-01');
      
      await waitFor(() => {
        expect(screen.getByTestId('birthdate-error')).toHaveTextContent('תאריך לידה לא תקין');
      });
      
      expect(birthdateInput).toHaveClass('border-red-500');
    });

    it('should hide error messages when field becomes valid', async () => {
      // Start with invalid
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'John');
      
      await waitFor(() => {
        expect(screen.getByTestId('first-name-error')).toBeInTheDocument();
      });

      // Now make it valid
      mockValidateHebrewName.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });

      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'משה');
      
      await waitFor(() => {
        expect(screen.queryByTestId('first-name-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should enable continue button when form is valid', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      // Fill all required fields
      await user.clear(screen.getByTestId('first-name-input'));
      await user.type(screen.getByTestId('first-name-input'), 'משה');
      
      await user.clear(screen.getByTestId('last-name-input'));
      await user.type(screen.getByTestId('last-name-input'), 'לוי');
      
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
    });

    it('should disable continue button when form is invalid', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'John');
      
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeDisabled();
      });
    });

    it('should call onSubmit with form data when continue button clicked', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<PersonalDetailsStep {...defaultProps} onSubmit={mockOnSubmit} />);
      
      // Fill all fields
      await user.clear(screen.getByTestId('first-name-input'));
      await user.type(screen.getByTestId('first-name-input'), 'משה');
      
      await user.clear(screen.getByTestId('last-name-input'));
      await user.type(screen.getByTestId('last-name-input'), 'לוי');
      
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
      
      await user.click(screen.getByTestId('continue-button'));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: 'משה',
        lastName: 'לוי',
        gender: 'male',
        birthdate: '1990-01-01',
      });
    });

    it('should not call onSubmit when form is invalid', async () => {
      mockValidateHebrewName.mockReturnValue({
        isValid: false,
        errorMessage: 'שם פרטי חייב להיות בעברית',
      });

      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<PersonalDetailsStep {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'John');
      
      // Try to click continue button (should be disabled)
      const continueButton = screen.getByTestId('continue-button');
      expect(continueButton).toBeDisabled();
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('UI Layout and Styling', () => {
    it('should have gender and birthdate in the same row', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const genderSelect = screen.getByTestId('gender-select');
      const birthdateInput = screen.getByTestId('birthdate-input');
      
      // Check that they share a parent with flex classes
      const parentDiv = genderSelect.closest('.flex');
      expect(parentDiv).toContainElement(birthdateInput);
      expect(parentDiv).toHaveClass('gap-4');
    });

    it('should have proper form field styling', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      expect(firstNameInput).toHaveClass('w-full', 'px-3', 'py-2', 'border-2', 'rounded-lg');
    });

    it('should show correct arrow direction in continue button', () => {
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const continueButton = screen.getByTestId('continue-button');
      const arrow = continueButton.querySelector('svg path');
      
      // Check that the arrow points left (< direction)
      expect(arrow).toHaveAttribute('d', 'M15 5l-7 7 7 7');
    });
  });

  describe('Real-time Validation', () => {
    it('should validate fields in real-time as user types', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      
      // Clear and type each character
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'מ');
      
      await waitFor(() => {
        expect(mockValidateHebrewName).toHaveBeenCalledWith('מ');
      });
      
      await user.type(firstNameInput, 'שה');
      
      await waitFor(() => {
        expect(mockValidateHebrewName).toHaveBeenCalledWith('משה');
      });
    });

    it('should update form validity when any field changes', async () => {
      // Mock validation to start with some fields invalid
      mockValidateGender.mockReturnValue({
        isValid: false,
        errorMessage: 'יש לבחור מין',
      });
      mockValidateBirthdate.mockReturnValue({
        isValid: false,
        errorMessage: 'יש להזין תאריך לידה',
      });

      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      // Initially form should be invalid (empty gender and birthdate)
      expect(screen.getByTestId('continue-button')).toBeDisabled();
      
      // Fill gender
      mockValidateGender.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      await user.selectOptions(screen.getByTestId('gender-select'), 'male');
      
      // Still invalid (birthdate missing)
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).toBeDisabled();
      });
      
      // Fill birthdate
      mockValidateBirthdate.mockReturnValue({
        isValid: true,
        errorMessage: null,
      });
      await user.type(screen.getByTestId('birthdate-input'), '1990-01-01');
      
      // Now should be valid
      await waitFor(() => {
        expect(screen.getByTestId('continue-button')).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSubmit prop gracefully', () => {
      expect(() => {
        render(<PersonalDetailsStep firstName="יוסי" lastName="כהן" />);
      }).not.toThrow();
    });

    it('should handle empty initial values', () => {
      render(<PersonalDetailsStep firstName="" lastName="" />);
      
      expect(screen.getByTestId('first-name-input')).toHaveValue('');
      expect(screen.getByTestId('last-name-input')).toHaveValue('');
      expect(screen.getByTestId('gender-select')).toHaveValue('');
      expect(screen.getByTestId('birthdate-input')).toHaveValue('');
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      render(<PersonalDetailsStep {...defaultProps} />);
      
      const firstNameInput = screen.getByTestId('first-name-input');
      
      // Rapid typing
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'אבגדהוזחטיכלמנסעפצקרשת');
      
      await waitFor(() => {
        expect(firstNameInput).toHaveValue('אבגדהוזחטיכלמנסעפצקרשת');
      });
    });
  });
});