// Shared types for registration flow components

/**
 * Personal details form data (Step 3)
 */
export interface PersonalDetailsData {
  firstName: string;
  lastName: string;
  gender: string;
  birthdate: string;
}

/**
 * Account creation form data (Step 4) 
 */
export interface AccountDetailsData {
  email: string;
  password: string;
  consent: boolean;
}

/**
 * Combined registration data for final submission
 */
export interface CompleteRegistrationData extends PersonalDetailsData, AccountDetailsData {
  phoneNumber: string; // From OTP step
}

/**
 * Validation errors for personal details
 */
export interface PersonalDetailsValidationErrors {
  gender: string | null;
  birthdate: string | null;
}

/**
 * Validation errors for account details
 */
export interface AccountDetailsValidationErrors {
  email: string | null;
  password: string | null;
  consent: string | null;
}

/**
 * Props for PersonalDetailsStep component
 */
export interface PersonalDetailsStepProps {
  firstName: string;
  lastName: string;
  onSubmit?: (data: PersonalDetailsData) => void;
  onBack?: () => void;
}

/**
 * Props for AccountDetailsStep component
 */
export interface AccountDetailsStepProps {
  onSubmit?: (data: AccountDetailsData) => void;
  onBack?: () => void;
}