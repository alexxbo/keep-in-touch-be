/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
// Load test environment variables before any tests run
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env.test'),
  quiet: true, // Suppress dotenv logs in test output
});
