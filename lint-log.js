#!/usr/bin/env node

/**
 * Wrapper script to run lint and clean logs
 */

const { execSync } = require('child_process');

try {
  // Run lint and redirect output to log file
  execSync('npm run lint > lint.log 2>&1', { stdio: 'inherit' });
} catch (error) {
  // Lint failed, but continue to clean
  console.error('Lint failed, but continuing to clean logs...');
}

// Clean the log file
require('./clean-logs.js').cleanLogFile('lint.log');

console.log('✅ Lint completed and logs cleaned!');
