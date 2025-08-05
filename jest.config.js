module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^firebase/firestore$': '<rootDir>/src/lib/__mocks__/firebase.ts',
    '^firebase/app$': '<rootDir>/src/lib/__mocks__/firebase.ts',
    '^firebase/auth$': '<rootDir>/src/lib/__mocks__/firebase.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.new.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
};
