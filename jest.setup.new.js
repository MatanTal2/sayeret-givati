const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import React Testing Library custom matchers
require('@testing-library/jest-dom');

// Mock Firebase environment variables for tests only
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key-for-tests';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain-for-tests';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id-for-tests';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket-for-tests';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-messaging-sender-id-for-tests';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app-id-for-tests';

// Mock Web Crypto API
const crypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length),
    subtle: {
      digest: async (algorithm, data) => {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest();
      }
    }
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

// Mock window.alert
global.alert = jest.fn()
