module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^firebase/firestore$': '<rootDir>/src/lib/__mocks__/firebase.ts',
    '^firebase/app$': '<rootDir>/src/lib/__mocks__/firebase.ts',
    '^firebase/auth$': '<rootDir>/src/lib/__mocks__/firebase.ts',
  },
  setupFiles: ['<rootDir>/jest.setup.new.js'],
};
