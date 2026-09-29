/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css)$': 'identity-obj-proxy',
    '\.(svg|png|ico|gif)$': '<rootDir>/src/test/fileStub.ts',
  },
  transform: { '^.+\.[jt]sx?$': 'babel-jest' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/test/**', '!src/**/*.d.ts'],
  clearMocks: true,
};
