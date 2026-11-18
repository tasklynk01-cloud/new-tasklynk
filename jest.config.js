/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/payment-calculations.ts',
    'src/lib/status-transitions.ts',
    'src/lib/internal-revision-helpers.ts',
    'src/app/api/v2/**/*.ts',
    '!src/app/api/v2/**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageThreshold: {
    'src/lib/payment-calculations.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    'src/lib/status-transitions.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  verbose: true,
};

module.exports = config;
