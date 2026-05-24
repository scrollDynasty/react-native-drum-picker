module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.{ts,tsx}'],
  testTimeout: 180000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  preset: '@react-native/jest-preset',
  verbose: true,
};
