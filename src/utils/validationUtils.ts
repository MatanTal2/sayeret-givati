// Reusable validation utility functions for form validation across the application

/**
 * Validation patterns for different field types
 */
export const VALIDATION_PATTERNS = {
  PERSONAL_NUMBER: /^[0-9]{5,7}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(?:\+972-?|0)(5[0-9])-?\d{7}$/,
  HEBREW_NAME: /^[\u05D0-\u05EA\s]+$/,
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
}

// Export individual validation functions for convenient use
export const validatePersonalNumber = FormValidationUtils.validatePersonalNumber;
export const validateEmail = FormValidationUtils.validateEmail;
export const validatePhone = FormValidationUtils.validatePhone;
export const validateHebrewName = FormValidationUtils.validateHebrewName;