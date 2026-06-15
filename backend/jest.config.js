module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: true
};
