export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/modules/auth/**/*.js',
    'src/modules/branches/**/*.js',
    'src/modules/categories/**/*.js',
    'src/modules/products/**/*.js',
    'src/modules/inventory/**/*.js',
    'src/modules/serials/**/*.js',
    'src/modules/orders/**/*.js',
    'src/middlewares/**/*.js',
    'src/utils/**/*.js',
    '!src/server.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000
};
