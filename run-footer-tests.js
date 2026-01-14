#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('=== Running Footer Social Tests ===\n');

const testFiles = [
  'src/app/admin/settings/__tests__/footer-social-x-twitter.test.tsx',
  'src/app/admin/settings/__tests__/footer-social-powered-by-beelms.test.tsx'
];

for (const testFile of testFiles) {
  console.log(`Running ${testFile}...`);
  try {
    const output = execSync(`npx jest ${testFile} --no-coverage --verbose`, {
      cwd: path.join(__dirname, 'fe'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ PASSED');
  } catch (error) {
    console.log('❌ FAILED');
    console.log(error.stdout || error.message);
  }
  console.log('');
}

console.log('=== Test Run Complete ===');
