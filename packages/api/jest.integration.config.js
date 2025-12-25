const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  rootDir: __dirname,
  testMatch: ['**/*.int.spec.ts', '<rootDir>/tests/integration/**/*.(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 20000,
};
