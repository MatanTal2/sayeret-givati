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
