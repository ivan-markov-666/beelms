#!/usr/bin/env node

/**
 * Wrapper script to run FE tests and clean logs
 */

const { execSync } = require('child_process');

try {
  // Run the tests and redirect output to log file
  execSync('npm run test:fe > test-fe.log 2>&1', { stdio: 'inherit' });
} catch (error) {
  // Tests failed, but continue to clean
  console.error('Tests failed, but continuing to clean logs...');
}

// Clean the log file
require('./clean-logs.js').cleanLogFile('test-fe.log');

console.log('✅ FE tests completed and logs cleaned!');
