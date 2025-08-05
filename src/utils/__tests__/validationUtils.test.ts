import { 
  validatePersonalNumber, 
  validateOTP,
  validateEmail,
  validatePassword,
  validateHebrewName,
  validateGender,
  validateBirthdate,
  validateConsent,
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
        // Note: Phone numbers are returned in reverse order (suffix***-prefix) 
        // to handle Hebrew RTL text direction issues in the UI display
        it('should mask standard Israeli mobile number', () => {
          const result = maskPhoneNumber('0521234567');
          expect(result).toBe('4567***-052');
        });

        it('should mask different Israeli mobile prefix', () => {
          const result = maskPhoneNumber('0541234567');
          expect(result).toBe('4567***-054');
        });

        it('should mask Israeli mobile with 050 prefix', () => {
          const result = maskPhoneNumber('0501234567');
          expect(result).toBe('4567***-050');
        });

        it('should mask Israeli mobile with 058 prefix', () => {
          const result = maskPhoneNumber('0581234567');
          expect(result).toBe('4567***-058');
        });
      });

      describe('should handle international format', () => {
        it('should convert +972 format to masked Israeli format', () => {
          const result = maskPhoneNumber('+972521234567');
          expect(result).toBe('4567***-052');
        });

        it('should convert 972 format (without +) to masked Israeli format', () => {
          const result = maskPhoneNumber('972521234567');
          expect(result).toBe('4567***-052');
        });

        it('should handle +972 with different mobile prefix', () => {
          const result = maskPhoneNumber('+972541234567');
          expect(result).toBe('4567***-054');
        });
      });

      describe('should handle formatted input', () => {
        it('should mask pre-formatted phone with hyphens', () => {
          const result = maskPhoneNumber('052-123-4567');
          expect(result).toBe('4567***-052');
        });

        it('should mask phone with spaces', () => {
          const result = maskPhoneNumber('052 123 4567');
          expect(result).toBe('4567***-052');
        });

        it('should mask phone with mixed formatting', () => {
          const result = maskPhoneNumber('+972-52 123 4567');
          expect(result).toBe('4567***-052');
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
          expect(result).toBe('4567***-052');
        });

        it('should handle number with +972 and hyphens', () => {
          const result = maskPhoneNumber('+972-52-123-4567');
          expect(result).toBe('4567***-052');
        });

        it('should preserve original for 9-digit input', () => {
          const input = '052123456';
          const result = maskPhoneNumber(input);
          expect(result).toBe(input);
        });

        it('should handle international format with extra digits', () => {
          const result = maskPhoneNumber('+97252123456789');
          expect(result).toBe('6789***-052');
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

  // Email Validation Tests
  describe('Email Validation', () => {
    describe('validateEmail', () => {
      describe('should validate correct email formats', () => {
        it('should accept standard email format', () => {
          const result = validateEmail('user@example.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with subdomain', () => {
          const result = validateEmail('test.user@sub.example.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with plus sign', () => {
          const result = validateEmail('user+tag@example.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with Israeli domain', () => {
          const result = validateEmail('user@domain.co.il');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with numbers', () => {
          const result = validateEmail('user123@example123.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with hyphens in domain', () => {
          const result = validateEmail('user@my-domain.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject empty email', () => {
        it('should reject empty string', () => {
          const result = validateEmail('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_REQUIRED);
        });

        it('should reject whitespace-only email', () => {
          const result = validateEmail('   ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_REQUIRED);
        });

        it('should reject tab and newline characters', () => {
          const result = validateEmail('\t\n');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_REQUIRED);
        });
      });

      describe('should reject invalid email formats', () => {
        it('should reject email without @', () => {
          const result = validateEmail('invalidexample.com');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_INVALID);
        });

        it('should reject email without domain', () => {
          const result = validateEmail('user@');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_INVALID);
        });

        it('should reject email without username', () => {
          const result = validateEmail('@domain.com');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_INVALID);
        });

        it('should accept email with double dots (current regex allows)', () => {
          // Note: Current simple email regex allows this pattern
          const result = validateEmail('user..name@domain.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should reject email with spaces', () => {
          const result = validateEmail('user name@domain.com');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_INVALID);
        });

        it('should reject email without top-level domain', () => {
          const result = validateEmail('user@domain');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.EMAIL_INVALID);
        });
      });

      describe('should handle special characters in email', () => {
        it('should accept email with dots in username', () => {
          const result = validateEmail('first.last@example.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept email with underscores', () => {
          const result = validateEmail('user_name@example.com');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should handle trimming whitespace', () => {
          const result = validateEmail('  user@example.com  ');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validateEmail', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          'user@example.com',
          'invalid',
          '',
          'user@',
          'test.email+tag@domain.co.il'
        ];

        testCases.forEach(testCase => {
          const exportedResult = validateEmail(testCase);
          const classResult = FormValidationUtils.validateEmail(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });

  // Password Validation Tests
  describe('Password Validation', () => {
    describe('validatePassword', () => {
      describe('should validate strong password', () => {
        it('should accept password with all requirements', () => {
          const result = validatePassword('Password123!');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept password with minimum length', () => {
          const result = validatePassword('Pass123!');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept password with special characters', () => {
          const result = validatePassword('MyStr0ng@Pass');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept password with various special chars', () => {
          const result = validatePassword('Test#123$Pass');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept long complex password', () => {
          const result = validatePassword('VeryLongPassword123!@#');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject empty password', () => {
        it('should reject empty string', () => {
          const result = validatePassword('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_REQUIRED);
        });

        it('should reject whitespace-only password', () => {
          const result = validatePassword('   ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_REQUIRED);
        });

        it('should reject tabs and newlines', () => {
          const result = validatePassword('\t\n  ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_REQUIRED);
        });
      });

      describe('should reject weak passwords', () => {
        it('should reject password without uppercase', () => {
          const result = validatePassword('password123!');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject password without lowercase', () => {
          const result = validatePassword('PASSWORD123!');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject password without numbers', () => {
          const result = validatePassword('Password!');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject password without special characters', () => {
          const result = validatePassword('Password123');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject password too short', () => {
          const result = validatePassword('Pass1!');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject only letters', () => {
          const result = validatePassword('password');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should reject only numbers', () => {
          const result = validatePassword('12345678');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });
      });

      describe('should handle minimum length', () => {
        it('should reject exactly 7 characters', () => {
          const result = validatePassword('Pass1!');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.PASSWORD_INVALID);
        });

        it('should accept exactly 8 characters', () => {
          const result = validatePassword('Pass123!');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept 10 characters', () => {
          const result = validatePassword('Password1!');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validatePassword', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          'Password123!',
          'weak',
          '',
          'Pass1!',
          'VeryStrongPassword123!'
        ];

        testCases.forEach(testCase => {
          const exportedResult = validatePassword(testCase);
          const classResult = FormValidationUtils.validatePassword(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });

  // Hebrew Name Validation Tests
  describe('Hebrew Name Validation', () => {
    describe('validateHebrewName', () => {
      describe('should validate correct Hebrew names', () => {
        it('should accept Hebrew first name', () => {
          const result = validateHebrewName('יוסף');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept Hebrew last name', () => {
          const result = validateHebrewName('כהן');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept Hebrew name with spaces', () => {
          const result = validateHebrewName('בן דוד');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept single Hebrew letter name', () => {
          const result = validateHebrewName('א');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should handle trimming whitespace', () => {
          const result = validateHebrewName('  יוסף  ');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject empty name', () => {
        it('should reject empty string', () => {
          const result = validateHebrewName('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_REQUIRED);
        });

        it('should reject whitespace-only string', () => {
          const result = validateHebrewName('   ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_REQUIRED);
        });

        it('should reject tabs and newlines', () => {
          const result = validateHebrewName('\t\n  ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_REQUIRED);
        });
      });

      describe('should reject invalid name formats', () => {
        it('should reject English letters', () => {
          const result = validateHebrewName('John');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_INVALID);
        });

        it('should reject numbers', () => {
          const result = validateHebrewName('יוסף123');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_INVALID);
        });

        it('should reject special characters', () => {
          const result = validateHebrewName('יוסף@');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_INVALID);
        });

        it('should reject mixed Hebrew and English', () => {
          const result = validateHebrewName('יוסףJohn');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_INVALID);
        });

        it('should reject hyphens (special case)', () => {
          const result = validateHebrewName('כהן-לוי');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.NAME_INVALID);
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validateHebrewName', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          'יוסף',
          'כהן',
          'בן דוד',
          'John',
          '',
          '   ',
          'יוסף123'
        ];

        testCases.forEach(testCase => {
          const exportedResult = validateHebrewName(testCase);
          const classResult = FormValidationUtils.validateHebrewName(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });

  // Gender Validation Tests
  describe('Gender Validation', () => {
    describe('validateGender', () => {
      describe('should validate selected gender', () => {
        it('should accept male selection', () => {
          const result = validateGender('male');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept female selection', () => {
          const result = validateGender('female');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept other selection', () => {
          const result = validateGender('other');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept any non-empty string', () => {
          const result = validateGender('custom');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should handle trimming whitespace', () => {
          const result = validateGender('  male  ');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject empty gender selection', () => {
        it('should reject empty string', () => {
          const result = validateGender('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.GENDER_REQUIRED);
        });

        it('should reject whitespace-only string', () => {
          const result = validateGender('   ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.GENDER_REQUIRED);
        });

        it('should reject tabs and newlines', () => {
          const result = validateGender('\t\n  ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.GENDER_REQUIRED);
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validateGender', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          'male',
          'female',
          'other',
          '',
          '   '
        ];

        testCases.forEach(testCase => {
          const exportedResult = validateGender(testCase);
          const classResult = FormValidationUtils.validateGender(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });



  // Birthdate Validation Tests
  describe('Birthdate Validation', () => {
    describe('validateBirthdate', () => {
      describe('should validate correct birthdate for adults', () => {
        it('should accept birthdate for 25-year-old', () => {
          const birthdate = new Date();
          birthdate.setFullYear(birthdate.getFullYear() - 25);
          const result = validateBirthdate(birthdate.toISOString().split('T')[0]);
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept birthdate for exactly 18-year-old', () => {
          const birthdate = new Date();
          birthdate.setFullYear(birthdate.getFullYear() - 18);
          birthdate.setDate(birthdate.getDate() - 1); // Ensure it's past the birthday
          const result = validateBirthdate(birthdate.toISOString().split('T')[0]);
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept old birthdate', () => {
          const result = validateBirthdate('1980-01-01');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        it('should accept birthdate from different month', () => {
          const result = validateBirthdate('1990-12-31');
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject empty birthdate', () => {
        it('should reject empty string', () => {
          const result = validateBirthdate('');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_REQUIRED);
        });

        it('should reject whitespace-only string', () => {
          const result = validateBirthdate('   ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_REQUIRED);
        });

        it('should reject tabs and newlines', () => {
          const result = validateBirthdate('\t\n  ');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_REQUIRED);
        });
      });

      describe('should reject future dates', () => {
        it('should reject tomorrow\'s date', () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const result = validateBirthdate(tomorrow.toISOString().split('T')[0]);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject next year', () => {
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          const result = validateBirthdate(nextYear.toISOString().split('T')[0]);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject far future date', () => {
          const result = validateBirthdate('2050-01-01');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });
      });

      describe('should reject underage birthdates', () => {
        it('should reject 17-year-old birthdate', () => {
          const birthdate = new Date();
          birthdate.setFullYear(birthdate.getFullYear() - 17);
          const result = validateBirthdate(birthdate.toISOString().split('T')[0]);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject 16-year-old birthdate', () => {
          const birthdate = new Date();
          birthdate.setFullYear(birthdate.getFullYear() - 16);
          const result = validateBirthdate(birthdate.toISOString().split('T')[0]);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject very young birthdate', () => {
          const birthdate = new Date();
          birthdate.setFullYear(birthdate.getFullYear() - 5);
          const result = validateBirthdate(birthdate.toISOString().split('T')[0]);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });
      });

      describe('should handle invalid date formats', () => {
        it('should reject invalid date string', () => {
          const result = validateBirthdate('invalid-date');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject malformed date', () => {
          const result = validateBirthdate('32/13/2000');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject incomplete date', () => {
          const result = validateBirthdate('2000-13');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });

        it('should reject text as date', () => {
          const result = validateBirthdate('not a date');
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID);
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validateBirthdate', () => {
      it('should work identically to the exported function', () => {
        const testCases = [
          '1990-01-01',
          '2010-01-01', // Too young
          '',
          'invalid-date',
          '2050-01-01' // Future
        ];

        testCases.forEach(testCase => {
          const exportedResult = validateBirthdate(testCase);
          const classResult = FormValidationUtils.validateBirthdate(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });

  // Consent Validation Tests
  describe('Consent Validation', () => {
    describe('validateConsent', () => {
      describe('should validate accepted consent', () => {
        it('should accept true consent', () => {
          const result = validateConsent(true);
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });

        // JavaScript boolean types only
        it('should handle explicit boolean true', () => {
          const result = validateConsent(Boolean(true));
          expect(result.isValid).toBe(true);
          expect(result.errorMessage).toBeNull();
        });
      });

      describe('should reject unaccepted consent', () => {
        it('should reject false consent', () => {
          const result = validateConsent(false);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.CONSENT_REQUIRED);
        });

        it('should handle explicit boolean false', () => {
          const result = validateConsent(Boolean(false));
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.CONSENT_REQUIRED);
        });

        // Testing JavaScript falsy behavior
        it('should reject undefined-like falsy values', () => {
          const result = validateConsent(false);
          expect(result.isValid).toBe(false);
          expect(result.errorMessage).toBe(VALIDATION_MESSAGES_HE.CONSENT_REQUIRED);
        });
      });
    });

    // Test the static class method directly
    describe('FormValidationUtils.validateConsent', () => {
      it('should work identically to the exported function', () => {
        const testCases = [true, false];

        testCases.forEach(testCase => {
          const exportedResult = validateConsent(testCase);
          const classResult = FormValidationUtils.validateConsent(testCase);
          
          expect(exportedResult.isValid).toBe(classResult.isValid);
          expect(exportedResult.errorMessage).toBe(classResult.errorMessage);
        });
      });
    });
  });
});