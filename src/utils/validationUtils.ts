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
   * @returns Masked phone number (e.g., "052-***4567")
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
    
    // Format: 052-***4567
    const prefix = normalizedPhone.slice(0, 3);
    const suffix = normalizedPhone.slice(-4);
    
    return `${suffix}`+ "***-" + `${prefix}`;
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
export const validateOTP = PhoneUtils.validateOTP;