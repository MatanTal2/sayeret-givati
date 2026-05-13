/**
 * Partial English mirror of TEXT_CONSTANTS — populated only for keys added
 * after `feedback_bilingual_text` (2026-05-13) took effect. The full
 * English population of legacy keys is the responsibility of the i18n PR.
 *
 * Lookup contract: `TEXT_EN.<SECTION>.<KEY>` mirrors
 * `TEXT_CONSTANTS.<SECTION>.<KEY>`. Missing keys here fall back to the
 * Hebrew string at the call site (the runtime is not yet locale-aware).
 */
export const TEXT_EN = {
  AUTH: {
    WRONG_PASSWORD: 'Current password is incorrect.',
    PHONE_ALREADY_LINKED: 'This phone number is linked to another account. Contact a system administrator.',
  },
  SETTINGS: {
    CHANGE_PASSWORD: 'Change password',
    CHANGE_PASSWORD_TITLE: 'Change password',
    CHANGE_PASSWORD_DESCRIPTION: 'Enter your current password, then the new one.',
    CURRENT_PASSWORD: 'Current password',
    NEW_PASSWORD: 'New password',
    CONFIRM_NEW_PASSWORD: 'Confirm new password',
    PASSWORDS_MISMATCH: 'Passwords do not match.',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
    PASSWORD_UNCHANGED: 'New password must differ from current.',
    CHANGE_PASSWORD_SUBMIT: 'Update password',
    CHANGE_PASSWORD_SUBMITTING: 'Updating...',
    CHANGE_PASSWORD_SUCCESS: 'Password updated successfully.',
    SHOW_PASSWORD: 'Show password',
    HIDE_PASSWORD: 'Hide password',

    // Change-phone modal (PR-C)
    CHANGE_PHONE_TITLE: 'Change phone number',
    CHANGE_PHONE_DESCRIPTION: 'Re-enter your password, type the new number, then confirm with the SMS code.',
    CHANGE_PHONE_STEP_REAUTH_TITLE: 'Confirm password',
    CHANGE_PHONE_STEP_NEW_NUMBER_TITLE: 'New phone number',
    CHANGE_PHONE_STEP_OTP_TITLE: 'Enter SMS code',
    CHANGE_PHONE_NEW_NUMBER_PLACEHOLDER: '+972501234567',
    CHANGE_PHONE_NEW_NUMBER_LABEL: 'New phone number (international format)',
    CHANGE_PHONE_OTP_LABEL: 'Code received via SMS',
    CHANGE_PHONE_RESEND_OTP: 'Resend code',
    CHANGE_PHONE_BACK_TO_STEP_NUMBER: 'Back — change number',
    CHANGE_PHONE_SUBMIT_NEW_NUMBER: 'Send SMS code',
    CHANGE_PHONE_SUBMIT_OTP: 'Confirm phone change',
    CHANGE_PHONE_SUBMITTING: 'Updating...',
    CHANGE_PHONE_SUCCESS: 'Phone number updated. Your other devices were signed out.',
    CHANGE_PHONE_SAME_NUMBER: 'The new number matches the existing one — nothing to change.',
    CHANGE_PHONE_INVALID_E164: 'Phone number must be in international format (e.g. +972501234567).',
    CHANGE_PHONE_RATE_LIMITED: 'Try again in a moment. Only one change per minute is allowed.',
    CHANGE_PHONE_MIRROR_FAILED: 'Saving the new number on the server failed. Try again or contact support.',
    CHANGE_PHONE_GENERIC_ERROR: 'Phone number change failed. Try again.',
  },
  PROFILE: {
    PHONE_NUMBER_LABEL: 'Phone number',
    TEAM: 'Team',
    ENLISTMENT_CYCLE: 'Enlistment cycle',
    ENLISTMENT_CYCLE_PLACEHOLDER: 'YYYY-MM',
    ADDRESS: 'Address',
    ADDRESS_PLACEHOLDER: 'City, street, house no.',
    EDIT_SECTION: 'Edit',
    EDIT_SECTION_ARIA: 'Edit section',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    SAVING: 'Saving...',
    SAVED: 'Saved',
    SAVE_ERROR: 'Save failed. Try again.',
  },
} as const;
