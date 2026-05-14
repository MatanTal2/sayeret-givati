import {
  readProfileImageCache,
  writeProfileImageCache,
  clearProfileImageCache,
} from '../profileImageCache';

const UID = 'user-123';
const URL_HTTPS = 'https://firebasestorage.googleapis.com/v0/b/x/o/y.jpg';
const URL_HTTP = 'http://example.test/x.jpg';

describe('profileImageCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns undefined when nothing cached', () => {
    expect(readProfileImageCache(UID)).toBeUndefined();
  });

  it('round-trips an https URL', () => {
    writeProfileImageCache(UID, URL_HTTPS);
    expect(readProfileImageCache(UID)).toBe(URL_HTTPS);
  });

  it('round-trips an http URL', () => {
    writeProfileImageCache(UID, URL_HTTP);
    expect(readProfileImageCache(UID)).toBe(URL_HTTP);
  });

  it('rejects non-http(s) URLs on read (legacy blob:)', () => {
    window.localStorage.setItem('profileImageCache:v1:' + UID, 'blob:http://localhost/abc');
    expect(readProfileImageCache(UID)).toBeUndefined();
  });

  it('writing an invalid URL clears the entry', () => {
    writeProfileImageCache(UID, URL_HTTPS);
    writeProfileImageCache(UID, undefined);
    expect(readProfileImageCache(UID)).toBeUndefined();
  });

  it('writing a non-http(s) URL clears the entry', () => {
    writeProfileImageCache(UID, URL_HTTPS);
    writeProfileImageCache(UID, 'blob:http://localhost/abc');
    expect(readProfileImageCache(UID)).toBeUndefined();
  });

  it('clearProfileImageCache removes the entry', () => {
    writeProfileImageCache(UID, URL_HTTPS);
    clearProfileImageCache(UID);
    expect(readProfileImageCache(UID)).toBeUndefined();
  });

  it('namespaces entries per uid', () => {
    writeProfileImageCache('a', URL_HTTPS);
    writeProfileImageCache('b', URL_HTTP);
    expect(readProfileImageCache('a')).toBe(URL_HTTPS);
    expect(readProfileImageCache('b')).toBe(URL_HTTP);
    clearProfileImageCache('a');
    expect(readProfileImageCache('a')).toBeUndefined();
    expect(readProfileImageCache('b')).toBe(URL_HTTP);
  });

  it('no-ops when uid is missing', () => {
    writeProfileImageCache(undefined, URL_HTTPS);
    expect(readProfileImageCache(undefined)).toBeUndefined();
    expect(window.localStorage.length).toBe(0);
  });

  it('swallows storage failures (quota / disabled)', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    expect(() => writeProfileImageCache(UID, URL_HTTPS)).not.toThrow();
    Storage.prototype.setItem = original;
  });
});
