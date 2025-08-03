import { 
  validatePersonalNumber, 
  FormValidationUtils,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES_HE 
} from '../validationUtils';

describe('Personal Number Validation', () => {
  describe('validatePersonalNumber', () => {
    describe('should validate correct personal number', () => {
      it('should accept 5-digit personal number', () => {
        const result = validatePersonalNumber('12345');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept 6-digit personal number', () => {
        const result = validatePersonalNumber('123456');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept 7-digit personal number', () => {
        const result = validatePersonalNumber('1234567');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept personal number with leading zeros', () => {
        const result = validatePersonalNumber('01234');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept personal number with all same digits', () => {
        const result = validatePersonalNumber('11111');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });
    });

    describe('should reject empty personal number', () => {
      it('should reject empty string', () => {
        const result = validatePersonalNumber('');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED);
      });

      it('should reject whitespace-only string', () => {
        const result = validatePersonalNumber('   ');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED);
      });

      it('should reject string with tabs and spaces', () => {
        const result = validatePersonalNumber('\t\n  ');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED);
      });

      // Note: JavaScript functions don't typically receive null/undefined 
      // but we test the logical behavior of empty/falsy values
      it('should handle undefined-like empty values', () => {
        const result = validatePersonalNumber('');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED);
      });
    });

    describe('should reject invalid personal number format', () => {
      it('should reject too short personal number (4 digits)', () => {
        const result = validatePersonalNumber('1234');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject too long personal number (8 digits)', () => {
        const result = validatePersonalNumber('12345678');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject personal number with letters', () => {
        const result = validatePersonalNumber('abc123');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject personal number with mixed letters and digits', () => {
        const result = validatePersonalNumber('12a345');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject personal number with special characters', () => {
        const result = validatePersonalNumber('123-45');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject personal number with dots', () => {
        const result = validatePersonalNumber('123.45');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject personal number with spaces in between', () => {
        const result = validatePersonalNumber('123 45');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject extremely long input', () => {
        const result = validatePersonalNumber('123456789012345');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });

      it('should reject single digit', () => {
        const result = validatePersonalNumber('1');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });
    });

    describe('should handle input sanitization', () => {
      it('should accept personal number with leading whitespace', () => {
        const result = validatePersonalNumber('  12345  ');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept personal number with trailing whitespace', () => {
        const result = validatePersonalNumber('123456  ');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept personal number with tabs and newlines around it', () => {
        const result = validatePersonalNumber('\t123456\n');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      it('should accept personal number with mixed whitespace characters', () => {
        const result = validatePersonalNumber(' \t 1234567 \n ');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });

      // Edge case: whitespace that results in empty string after trimming
      it('should reject input that becomes empty after trimming', () => {
        const result = validatePersonalNumber('   \t\n   ');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED);
      });

      // Edge case: input with valid digits but invalid format after trimming
      it('should still validate format after trimming whitespace', () => {
        const result = validatePersonalNumber('  1234  '); // Only 4 digits
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
      });
    });
  });

  // Test the static class method directly as well for completeness
  describe('FormValidationUtils.validatePersonalNumber', () => {
    it('should work identically to the exported function', () => {
      const testCases = [
        '12345',
        '',
        '1234',
        '  123456  ',
        'abc123'
      ];

      testCases.forEach(testCase => {
        const exportedResult = validatePersonalNumber(testCase);
        const classResult = FormValidationUtils.validatePersonalNumber(testCase);
        
        expect(exportedResult.isValid).toBe(classResult.isValid);
        expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
      });
    });
  });

  // Test the validation patterns and constants
  describe('Validation Constants', () => {
    it('should have correct personal number regex pattern', () => {
      const pattern = VALIDATION_PATTERNS.PERSONAL_NUMBER;
      
      // Should match valid lengths (5-7 digits)
      expect(pattern.test('12345')).toBe(true);
      expect(pattern.test('123456')).toBe(true);
      expect(pattern.test('1234567')).toBe(true);
      
      // Should not match invalid lengths
      expect(pattern.test('1234')).toBe(false);
      expect(pattern.test('12345678')).toBe(false);
      
      // Should not match non-digits
      expect(pattern.test('12a45')).toBe(false);
      expect(pattern.test('12-34')).toBe(false);
    });

    it('should have correct Hebrew error messages', () => {
      expect(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED).toBe('מספר אישי הוא שדה חובה');
      expect(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID).toBe('מספר אישי חייב להכיל בין 5-7 ספרות בלבד');
    });
  });

  // Edge cases and boundary testing
  describe('Edge Cases and Boundary Testing', () => {
    it('should handle exactly minimum valid length (5 digits)', () => {
      const result = validatePersonalNumber('00000');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should handle exactly maximum valid length (7 digits)', () => {
      const result = validatePersonalNumber('9999999');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject exactly one digit below minimum (4 digits)', () => {
      const result = validatePersonalNumber('9999');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
    });

    it('should reject exactly one digit above maximum (8 digits)', () => {
      const result = validatePersonalNumber('10000000');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID);
    });

    // Test with various Unicode whitespace characters
    it('should handle different types of Unicode whitespace', () => {
      const unicodeSpaces = [
        '\u0020', // Regular space
        '\u00A0', // Non-breaking space
        '\u2028', // Line separator
        '\u2029'  // Paragraph separator
      ];

      unicodeSpaces.forEach(space => {
        const result = validatePersonalNumber(`${space}12345${space}`);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
      });
    });
  });
});