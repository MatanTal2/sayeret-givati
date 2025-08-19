// Reusable validation utility functions for form validation across the application

/**
 * Validation patterns for different field types
 */
export const VALIDATION_PATTERNS = {
  PERSONAL_NUMBER: /^[0-9]{5,7}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(?:\+972-?|0)(5[0-9])-?\d{7}$/,
  HEBREW_NAME: /^[\u05D0-\u05EA\s]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
} as const;

/**
 * Hebrew validation error messages
 */
export const VALIDATION_MESSAGES_HE = {
  PERSONAL_NUMBER_REQUIRED: 'מספר אישי הוא שדה חובה',
  PERSONAL_NUMBER_INVALID: 'מספר אישי חייב להכיל בין 5-7 ספרות בלבד',
  EMAIL_REQUIRED: 'כתובת אימייל היא שדה חובה',
  EMAIL_INVALID: 'כתובת אימייל לא תקינה',
  PHONE_REQUIRED: 'מספר טלפון הוא שדה חובה',
  PHONE_INVALID: 'מספר טלפון לא תקין',
  NAME_REQUIRED: 'שם הוא שדה חובה',
  NAME_INVALID: 'השם חייב להכיל רק אותיות עבריות',
  OTP_INVALID: 'הקוד חייב להכיל 6 ספרות בדיוק',
  PASSWORD_REQUIRED: 'סיסמה היא שדה חובה',
  PASSWORD_INVALID: 'סיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר',
  GENDER_REQUIRED: 'בחירת מין היא שדה חובה',
  BIRTHDATE_REQUIRED: 'תאריך לידה הוא שדה חובה',
  BIRTHDATE_INVALID: 'תאריך לידה לא תקין',
  CONSENT_REQUIRED: 'יש לאשר את תנאי השימוש',
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Validation utility functions
 */
export class FormValidationUtils {
  /**
   * Validate personal number (military ID)
   * @param value - The personal number to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validatePersonalNumber(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_REQUIRED
      };
    }

    if (!VALIDATION_PATTERNS.PERSONAL_NUMBER.test(value.trim())) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PERSONAL_NUMBER_INVALID
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate email address
   * @param value - The email to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateEmail(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.EMAIL_REQUIRED
      };
    }

    if (!VALIDATION_PATTERNS.EMAIL.test(value.trim())) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.EMAIL_INVALID
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate phone number (Israeli format)
   * @param value - The phone number to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validatePhone(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PHONE_REQUIRED
      };
    }

    if (!VALIDATION_PATTERNS.PHONE.test(value.trim())) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PHONE_INVALID
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate Hebrew name
   * @param value - The name to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateHebrewName(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.NAME_REQUIRED
      };
    }

    if (!VALIDATION_PATTERNS.HEBREW_NAME.test(value.trim())) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.NAME_INVALID
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate password strength
   * @param value - The password to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validatePassword(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PASSWORD_REQUIRED
      };
    }

    if (!VALIDATION_PATTERNS.PASSWORD.test(value)) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.PASSWORD_INVALID
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate gender selection
   * @param value - The gender value to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateGender(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.GENDER_REQUIRED
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }

  /**
   * Validate birthdate
   * @param value - The birthdate to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateBirthdate(value: string): ValidationResult {
    if (!value || !value.trim()) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.BIRTHDATE_REQUIRED
      };
    }

    // Basic date validation - ensure it's a valid date and not in the future
    const date = new Date(value);
    const today = new Date();
    
    if (isNaN(date.getTime()) || date > today) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID
      };
    }

      // Age validation: must be 18+
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );

    if (date > eighteenYearsAgo) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.BIRTHDATE_INVALID
      };
    }
    return {
      isValid: true,
      errorMessage: null
    };
  }



  /**
   * Validate consent checkbox
   * @param value - The consent value to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateConsent(value: boolean): ValidationResult {
    if (!value) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.CONSENT_REQUIRED
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }
}

/**
 * Phone number utility functions
 */
export class PhoneUtils {
  /**
   * Mask phone number showing only first 3 and last 4 digits
   * @param phoneNumber - The phone number to mask (e.g., "0521234567")
   * @returns Masked phone number (e.g., "4567***-052")
   * @note Returns in reverse order to handle Hebrew RTL text direction issues in UI
   */
  static maskPhoneNumber(phoneNumber: string): string {
    // Clean the phone number (remove spaces, dashes, etc.)
    const cleaned = phoneNumber.replace(/[\s\-+]/g, '');
    
    // Handle different formats
    let normalizedPhone = cleaned;
    if (cleaned.startsWith('+972')) {
      normalizedPhone = '0' + cleaned.slice(4);
    } else if (cleaned.startsWith('972')) {
      normalizedPhone = '0' + cleaned.slice(3);
    }
    
    // Ensure we have at least 10 digits
    if (normalizedPhone.length < 10) {
      return phoneNumber; // Return original if invalid
    }
    
    // Format: 4567***-052 (reversed for Hebrew RTL display)
    const prefix = normalizedPhone.slice(0, 3);
    const suffix = normalizedPhone.slice(-4);
    
    return `${suffix}***-${prefix}`;
  }

  /**
   * Format phone number for international delivery
   * Ensures phone number is in E.164 format (+972XXXXXXXXX)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Handle Israeli phone numbers
    if (cleanNumber.startsWith('972')) {
      // Already has country code
      return `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0')) {
      // Remove leading 0 and add +972
      return `+972${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9) {
      // 9-digit number without leading 0
      return `+972${cleanNumber}`;
    } else {
      // Return as is with + prefix
      return `+${cleanNumber}`;
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    error?: string;
    formattedNumber?: string;
  } {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      
      // Basic validation for Israeli numbers
      if (formatted.startsWith('+972')) {
        const numberPart = formatted.substring(4); // Remove +972
        if (numberPart.length === 9 && /^[5-9]/.test(numberPart)) {
          return {
            isValid: true,
            formattedNumber: formatted
          };
        }
      }

      // For other international numbers, do basic length check
      if (formatted.length >= 10 && formatted.length <= 15) {
        return {
          isValid: true,
          formattedNumber: formatted
        };
      }

      return {
        isValid: false,
        error: 'Invalid phone number format'
      };

    } catch {
      return {
        isValid: false,
        error: 'Error validating phone number'
      };
    }
  }

  /**
   * Format phone number for display (converts +972XXXXXXXXX to 0XX-XXXXXXX)
   * @param phone - The phone number to format
   * @returns Formatted phone number for display
   */
  static formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    
    // Convert +972XXXXXXXXX to 0XX-XXXXXXX format for display
    if (phone.startsWith('+972')) {
      const number = phone.slice(4); // Remove +972
      return `0${number.slice(0, 2)}-${number.slice(2)}`;
    }
    
    // If already in display format or other format, return as is
    return phone;
  }

  /**
   * Normalize phone number for search (removes dashes, spaces, and formats consistently)
   * @param phone - The phone number to normalize
   * @returns Normalized phone number without formatting characters
   */
  static normalizePhoneForSearch(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Convert +972XXXXXXXXX to 0XXXXXXXXX format for consistent searching
    if (cleaned.startsWith('+972')) {
      return '0' + cleaned.slice(4);
    }
    
    // If starts with 972, convert to 0XXXXXXXXX
    if (cleaned.startsWith('972') && cleaned.length === 12) {
      return '0' + cleaned.slice(3);
    }
    
    return cleaned;
  }

  /**
   * Validate OTP code
   * @param code - The OTP code to validate
   * @returns ValidationResult with isValid status and error message
   */
  static validateOTP(code: string): ValidationResult {
    if (!code || code.length !== 6) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.OTP_INVALID || 'הקוד חייב להכיל 6 ספרות בדיוק'
      };
    }

    if (!/^\d{6}$/.test(code)) {
      return {
        isValid: false,
        errorMessage: VALIDATION_MESSAGES_HE.OTP_INVALID || 'הקוד חייב להכיל 6 ספרות בדיוק'
      };
    }

    return {
      isValid: true,
      errorMessage: null
    };
  }
}

// Export individual validation functions for convenient use
export const validatePersonalNumber = FormValidationUtils.validatePersonalNumber;
export const validateEmail = FormValidationUtils.validateEmail;
export const validatePhone = FormValidationUtils.validatePhone;
export const validateHebrewName = FormValidationUtils.validateHebrewName;
export const validatePassword = FormValidationUtils.validatePassword;

export const validateGender = FormValidationUtils.validateGender;
export const validateBirthdate = FormValidationUtils.validateBirthdate;
export const validateConsent = FormValidationUtils.validateConsent;
export const maskPhoneNumber = PhoneUtils.maskPhoneNumber;
export const formatPhoneForDisplay = PhoneUtils.formatPhoneForDisplay;
export const normalizePhoneForSearch = PhoneUtils.normalizePhoneForSearch;
export const validateOTP = PhoneUtils.validateOTP;