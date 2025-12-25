module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: false }],
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test|eval).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  moduleNameMapper: {
    '^@em/orchestrator$': '<rootDir>/../orchestrator/src/index',
    '^@em/orchestrator/(.*)$': '<rootDir>/../orchestrator/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup-tests.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/integration/', '\\.int\\.spec\\.(ts|tsx)$'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'dist',
  ],
  testTimeout: 10000,
};
