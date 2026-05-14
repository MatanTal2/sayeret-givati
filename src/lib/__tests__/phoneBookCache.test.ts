import { Timestamp } from 'firebase/firestore';
import {
  readPhoneBookCache,
  writePhoneBookCache,
  clearPhoneBookCache,
  mergeDelta,
  PHONE_BOOK_CACHE_KEY,
  PHONE_BOOK_CACHE_TTL_MS,
} from '../phoneBook/phoneBookCache';
import type { PhoneBookEntry } from '@/types/phoneBook';

function makeEntry(over: Partial<PhoneBookEntry> = {}): PhoneBookEntry {
  return {
    id: 'h1',
    source: 'users',
    displayName: 'Alice Cohen',
    firstName: 'Alice',
    lastName: 'Cohen',
    phoneNumber: '+972501234567',
    isRegistered: true,
    createdAt: Timestamp.fromMillis(1_700_000_000_000),
    updatedAt: Timestamp.fromMillis(1_700_000_500_000),
    ...over,
  };
}

describe('phoneBookCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useRealTimers();
  });

  it('returns null when nothing cached', () => {
    expect(readPhoneBookCache()).toBeNull();
  });

  it('round-trips entries with serialized timestamps', () => {
    const entry = makeEntry();
    writePhoneBookCache([entry], 1_700_000_500_000);
    const got = readPhoneBookCache();
    expect(got).not.toBeNull();
    expect(got!.entries).toHaveLength(1);
    expect(got!.entries[0].id).toBe('h1');
    expect(got!.entries[0].displayName).toBe('Alice Cohen');
    // updatedAt is rebuilt as a Timestamp-like object exposing toMillis.
    expect(got!.entries[0].updatedAt.toMillis()).toBe(1_700_000_500_000);
    expect(got!.lastSyncedAtMs).toBe(1_700_000_500_000);
  });

  it('expires entries past TTL', () => {
    writePhoneBookCache([makeEntry()], 1_700_000_500_000);
    const payload = JSON.parse(window.localStorage.getItem(PHONE_BOOK_CACHE_KEY)!);
    payload.cachedAtMs = Date.now() - PHONE_BOOK_CACHE_TTL_MS - 1;
    window.localStorage.setItem(PHONE_BOOK_CACHE_KEY, JSON.stringify(payload));
    expect(readPhoneBookCache()).toBeNull();
    expect(window.localStorage.getItem(PHONE_BOOK_CACHE_KEY)).toBeNull();
  });

  it('discards malformed payloads', () => {
    window.localStorage.setItem(PHONE_BOOK_CACHE_KEY, '{"not the right shape": true}');
    expect(readPhoneBookCache()).toBeNull();
  });

  it('discards non-JSON payloads', () => {
    window.localStorage.setItem(PHONE_BOOK_CACHE_KEY, 'definitely not json');
    expect(readPhoneBookCache()).toBeNull();
  });

  it('clearPhoneBookCache removes the entry', () => {
    writePhoneBookCache([makeEntry()], 1_700_000_500_000);
    clearPhoneBookCache();
    expect(readPhoneBookCache()).toBeNull();
  });

  it('swallows quota errors on write', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    expect(() => writePhoneBookCache([makeEntry()], 1)).not.toThrow();
    Storage.prototype.setItem = original;
  });

  describe('mergeDelta', () => {
    it('returns base unchanged when delta is empty', () => {
      const a = makeEntry();
      const result = mergeDelta([a], []);
      expect(result).toEqual([a]);
    });

    it('appends new entries', () => {
      const a = makeEntry({ id: 'a' });
      const b = makeEntry({ id: 'b', displayName: 'Beni Levi' });
      const result = mergeDelta([a], [b]);
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id).sort()).toEqual(['a', 'b']);
    });

    it('replaces existing entries by id (delta wins)', () => {
      const a = makeEntry({ id: 'a', displayName: 'Old Name' });
      const aNew = makeEntry({ id: 'a', displayName: 'New Name' });
      const result = mergeDelta([a], [aNew]);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('New Name');
    });
  });
});
