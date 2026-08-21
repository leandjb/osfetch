/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['test'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  passWithNoTests: true,
};
