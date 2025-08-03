import { 
  validatePersonalNumber, 
  validateOTP,
  maskPhoneNumber,
  FormValidationUtils,
  PhoneUtils,
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

  // OTP Validation Tests
  describe('OTP Validation', () => {
    describe('validateOTP', () => {
      describe('should validate correct OTP format', () => {
        it('should accept 6-digit OTP code', () => {
          const result = validateOTP('123456');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP with all zeros', () => {
          const result = validateOTP('000000');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP with all nines', () => {
          const result = validateOTP('999999');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP with leading zeros', () => {
          const result = validateOTP('000123');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP with mixed digits', () => {
          const result = validateOTP('012345');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject incorrect OTP length', () => {
        it('should reject 5-digit OTP', () => {
          const result = validateOTP('12345');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject 7-digit OTP', () => {
          const result = validateOTP('1234567');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject empty OTP', () => {
          const result = validateOTP('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject very long OTP', () => {
          const result = validateOTP('123456789');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject single digit', () => {
          const result = validateOTP('1');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });
      });

      describe('should reject non-numeric OTP', () => {
        it('should reject OTP with letters at the end', () => {
          const result = validateOTP('12345a');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject OTP with letters at the beginning', () => {
          const result = validateOTP('abc123');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject OTP with hyphens', () => {
          const result = validateOTP('12-34-56');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject OTP with spaces', () => {
          const result = validateOTP('123 456');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject OTP with special characters', () => {
          const result = validateOTP('123@45');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });

        it('should reject OTP with dots', () => {
          const result = validateOTP('123.456');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.OTP_INVALID);
        });
      });

      describe('should handle leading zeros', () => {
        it('should accept OTP starting with multiple zeros', () => {
          const result = validateOTP('000123');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP with zeros in middle', () => {
          const result = validateOTP('120045');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept OTP ending with zeros', () => {
          const result = validateOTP('123000');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });
    });

    // Test the static class method directly
    describe('PhoneUtils.validateOTP', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          '123456',
          '12345',
          '1234567',
          '',
          '12345a',
          '000123'
        ];

        testCases.forEach(testCase => {
          const exportedResult = validateOTP(testCase);
          const classResult = PhoneUtils.validateOTP(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });

    // OTP regex pattern testing
    describe('OTP Pattern Validation', () => {
      it('should match exactly 6 digits', () => {
        const validOTPs = ['123456', '000000', '999999', '012345'];
        const invalidOTPs = ['12345', '1234567', '12345a', '123-45', ''];

        validOTPs.forEach(otp => {
          expect(/^\d{6}$/.test(otp)).toBe(true);
        });

        invalidOTPs.forEach(otp => {
          expect(/^\d{6}$/.test(otp)).toBe(false);
        });
      });
    });
  });

  // Phone Number Masking Tests
  describe('Phone Number Utilities', () => {
    describe('maskPhoneNumber', () => {
      describe('should mask Israeli phone numbers correctly', () => {
        it('should mask standard Israeli mobile number', () => {
          const result = maskPhoneNumber('0521234567');
          expect(result).toBe('052-***4567');
        });

        it('should mask different Israeli mobile prefix', () => {
          const result = maskPhoneNumber('0541234567');
          expect(result).toBe('054-***4567');
        });

        it('should mask Israeli mobile with 050 prefix', () => {
          const result = maskPhoneNumber('0501234567');
          expect(result).toBe('050-***4567');
        });

        it('should mask Israeli mobile with 058 prefix', () => {
          const result = maskPhoneNumber('0581234567');
          expect(result).toBe('058-***4567');
        });
      });

      describe('should handle international format', () => {
        it('should convert +972 format to masked Israeli format', () => {
          const result = maskPhoneNumber('+972521234567');
          expect(result).toBe('052-***4567');
        });

        it('should convert 972 format (without +) to masked Israeli format', () => {
          const result = maskPhoneNumber('972521234567');
          expect(result).toBe('052-***4567');
        });

        it('should handle +972 with different mobile prefix', () => {
          const result = maskPhoneNumber('+972541234567');
          expect(result).toBe('054-***4567');
        });
      });

      describe('should handle formatted input', () => {
        it('should mask pre-formatted phone with hyphens', () => {
          const result = maskPhoneNumber('052-123-4567');
          expect(result).toBe('052-***4567');
        });

        it('should mask phone with spaces', () => {
          const result = maskPhoneNumber('052 123 4567');
          expect(result).toBe('052-***4567');
        });

        it('should mask phone with mixed formatting', () => {
          const result = maskPhoneNumber('+972-52 123 4567');
          expect(result).toBe('052-***4567');
        });
      });

      describe('should return original for invalid input', () => {
        it('should return original for too short number', () => {
          const input = '123';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });

        it('should return original for non-numeric input', () => {
          const input = 'invalid';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });

        it('should return original for empty input', () => {
          const input = '';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });

        it('should return original for very short Israeli number', () => {
          const input = '052123';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });
      });

      describe('edge cases and special scenarios', () => {
        it('should handle exactly 10 digit Israeli number', () => {
          const result = maskPhoneNumber('0521234567');
          expect(result).toBe('052-***4567');
        });

        it('should handle number with +972 and hyphens', () => {
          const result = maskPhoneNumber('+972-52-123-4567');
          expect(result).toBe('052-***4567');
        });

        it('should preserve original for 9-digit input', () => {
          const input = '052123456';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });

        it('should handle international format with extra digits', () => {
          const result = maskPhoneNumber('+97252123456789');
          expect(result).toBe('052-***6789');
        });
      });
    });

    // Test the static class method directly
    describe('PhoneUtils.maskPhoneNumber', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          '0521234567',
          '+972521234567',
          '052-123-4567',
          '123',
          'invalid',
          ''
        ];

        testCases.forEach(testCase => {
          const exportedResult = maskPhoneNumber(testCase);
          const classResult = PhoneUtils.maskPhoneNumber(testCase);
          
          expect(exportedResult).toBe(classResult);
        });
      });
    });
  });
});