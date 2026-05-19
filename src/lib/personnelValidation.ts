/**
 * Personnel-row validation helpers (extracted from the old `UpdatePersonnel`
 * + `ViewPersonnel` components).
 *
 * Used by `PersonnelTab` (inline edit) and `PersonnelFiltersBar` (search).
 */

import { MILITARY_RANKS } from '@/types/admin';
import {
  VALIDATION_PATTERNS as FORM_VALIDATION_PATTERNS,
  PhoneUtils,
} from '@/utils/validationUtils';

/**
 * Strip non-digits and collapse +972 / 972 prefixes to the local `0XXXXXXXXX`
 * shape so phone numbers entered in any format compare cleanly.
 * Re-exported from `PhoneUtils.normalizePhoneForSearch` (kept here so the
 * personnel modules can import a single namespace).
 */
export function normalizePhoneForSearch(phone: string): string {
  return PhoneUtils.normalizePhoneForSearch(phone);
}

/**
 * Validate a Hebrew first/last name. Accepts Hebrew letters, spaces,
 * hyphens (`-`), and apostrophes (`'` or `׳`).
 */
export function isValidPersonnelName(value: string): boolean {
  if (!value || !value.trim()) return false;
  return FORM_VALIDATION_PATTERNS.HEBREW_NAME.test(value.trim());
}

/**
 * Validate a military rank against the canonical list in `MILITARY_RANKS`.
 * Empty / unknown ranks fail. Free-text input is not accepted.
 */
export function isValidPersonnelRank(value: string): boolean {
  if (!value || !value.trim()) return false;
  return (MILITARY_RANKS as readonly string[]).includes(value.trim());
}

/**
 * Validate an Israeli mobile phone number. Accepts any of:
 *   - `0XXXXXXXXX`
 *   - `+972-XX-XXXXXXX`
 *   - `972XXXXXXXXX`
 * with optional dashes / spaces (stripped before pattern match).
 */
export function isValidPersonnelPhone(value: string): boolean {
  if (!value || !value.trim()) return false;
  const normalized = normalizePhoneForSearch(value);
  return FORM_VALIDATION_PATTERNS.PHONE.test(normalized);
}

/**
 * Smart-match a search term against a personnel record's name & phone.
 * Returns true when the term hits either side.
 *
 * Term may be plain text (matched against the joined full name, case-insensitive)
 * or contain digits / dashes / plus (matched against the phone in any format).
 */
export function matchesPersonnelSearch(
  person: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  },
  rawTerm: string,
): boolean {
  const term = rawTerm.trim();
  if (!term) return true;

  const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
  if (fullName.includes(term.toLowerCase())) return true;

  const isPhoneSearch = /[\d\-+]/.test(term);
  if (!isPhoneSearch) return false;

  const normalizedTerm = normalizePhoneForSearch(term);
  const normalizedPhone = normalizePhoneForSearch(person.phoneNumber);
  if (normalizedTerm && normalizedPhone.includes(normalizedTerm)) return true;

  return person.phoneNumber.includes(term);
}
