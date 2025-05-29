module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['migrations/**/*.ts'],
  // Добави тези опции:
  testTimeout: 120000, // увеличаваме таймаута
  detectOpenHandles: true, // автоматично включва тази опция
  forceExit: true, // принудително излизане след тестовете
};
