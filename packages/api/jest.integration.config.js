const base = require('./jest.config');

module.exports = {
  ...base,
  testMatch: [
    '<rootDir>/tests/integration/**/*.ts',
    '**/*.int.spec.ts',
    '**/*.integration.spec.ts',
  ],
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
  ],
};
