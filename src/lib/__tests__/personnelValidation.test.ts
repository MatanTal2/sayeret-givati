/**
 * Tests for `src/lib/personnelValidation.ts` — phone normalization +
 * Hebrew-name + rank rules used by the merged Personnel tab.
 */

import {
  isValidPersonnelName,
  isValidPersonnelPhone,
  isValidPersonnelRank,
  matchesPersonnelSearch,
  normalizePhoneForSearch,
} from '@/lib/personnelValidation';

describe('normalizePhoneForSearch', () => {
  it('strips dashes and spaces', () => {
    expect(normalizePhoneForSearch('050-123-4567')).toBe('0501234567');
    expect(normalizePhoneForSearch('050 123 4567')).toBe('0501234567');
  });

  it('collapses +972 prefix to local 0XX format', () => {
    expect(normalizePhoneForSearch('+972501234567')).toBe('0501234567');
  });

  it('collapses 972 prefix (no +) to local 0XX format', () => {
    expect(normalizePhoneForSearch('972501234567')).toBe('0501234567');
  });

  it('returns empty string for empty input', () => {
    expect(normalizePhoneForSearch('')).toBe('');
  });
});

describe('isValidPersonnelName', () => {
  it('accepts plain Hebrew names', () => {
    expect(isValidPersonnelName('יוסי')).toBe(true);
    expect(isValidPersonnelName('בן דוד')).toBe(true);
  });

  it('accepts hyphenated and apostrophe names', () => {
    expect(isValidPersonnelName("בן-גוריון")).toBe(true);
    expect(isValidPersonnelName("שילה'")).toBe(true);
  });

  it('rejects empty / whitespace-only input', () => {
    expect(isValidPersonnelName('')).toBe(false);
    expect(isValidPersonnelName('   ')).toBe(false);
  });

  it('rejects non-Hebrew characters', () => {
    expect(isValidPersonnelName('David')).toBe(false);
    expect(isValidPersonnelName('יוסי5')).toBe(false);
  });
});

describe('isValidPersonnelRank', () => {
  it('accepts canonical ranks', () => {
    expect(isValidPersonnelRank('סמל')).toBe(true);
    expect(isValidPersonnelRank('סרן')).toBe(true);
  });

  it('rejects free-text or unknown ranks', () => {
    expect(isValidPersonnelRank('Major')).toBe(false);
    expect(isValidPersonnelRank('')).toBe(false);
    expect(isValidPersonnelRank('סופר-סופר')).toBe(false);
  });
});

describe('isValidPersonnelPhone', () => {
  it('accepts Israeli numbers in any common shape', () => {
    expect(isValidPersonnelPhone('0501234567')).toBe(true);
    expect(isValidPersonnelPhone('050-123-4567')).toBe(true);
    expect(isValidPersonnelPhone('+972501234567')).toBe(true);
  });

  it('rejects non-Israeli or short numbers', () => {
    expect(isValidPersonnelPhone('123')).toBe(false);
    expect(isValidPersonnelPhone('')).toBe(false);
    expect(isValidPersonnelPhone('+11234567890')).toBe(false);
  });
});

describe('matchesPersonnelSearch', () => {
  const person = {
    firstName: 'יוסי',
    lastName: 'כהן',
    phoneNumber: '0501234567',
  };

  it('matches the joined full name', () => {
    expect(matchesPersonnelSearch(person, 'יוסי')).toBe(true);
    expect(matchesPersonnelSearch(person, 'כהן')).toBe(true);
    expect(matchesPersonnelSearch(person, 'יוסי כהן')).toBe(true);
  });

  it('matches partial phone with dashes', () => {
    expect(matchesPersonnelSearch(person, '050-123')).toBe(true);
    expect(matchesPersonnelSearch(person, '1234567')).toBe(true);
  });

  it('matches +972 input against locally-stored phone', () => {
    expect(matchesPersonnelSearch(person, '+972501234567')).toBe(true);
  });

  it('returns true on empty term (no narrowing)', () => {
    expect(matchesPersonnelSearch(person, '')).toBe(true);
    expect(matchesPersonnelSearch(person, '   ')).toBe(true);
  });

  it('returns false when neither side matches', () => {
    expect(matchesPersonnelSearch(person, 'דנה')).toBe(false);
    expect(matchesPersonnelSearch(person, '0509999999')).toBe(false);
  });
});
