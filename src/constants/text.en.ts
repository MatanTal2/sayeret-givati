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
  PROFILE: {
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
