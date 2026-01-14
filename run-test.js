const { execSync } = require('child_process');
const path = require('path');

console.log('Running footer social tests...');
try {
  const result = execSync('npx jest src/app/admin/settings/__tests__/footer-social-x-twitter.test.tsx --no-coverage --verbose', {
    cwd: path.join(__dirname, 'fe'),
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('Test completed successfully');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
