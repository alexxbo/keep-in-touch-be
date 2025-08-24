module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/testHelpers.ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^~models/(.*)$': '<rootDir>/src/models/$1',
    '^~services/(.*)$': '<rootDir>/src/services/$1',
    '^~controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^~middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^~utils/(.*)$': '<rootDir>/src/utils/$1',
    '^~config/(.*)$': '<rootDir>/src/config/$1',
    '^~routes/(.*)$': '<rootDir>/src/routes/$1',
    '^~validation/(.*)$': '<rootDir>/src/validation/$1',
    '^~types/(.*)$': '<rootDir>/src/types/$1',
    '^~templates/(.*)$': '<rootDir>/src/templates/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};
