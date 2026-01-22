module.exports = {
  preset: 'react-native',
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/example/e2e/'],
};
