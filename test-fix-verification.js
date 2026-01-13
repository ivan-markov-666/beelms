const { execSync } = require('child_process');

console.log('🧪 Running frontend timeout fix test...\n');

try {
  const feOutput = execSync('cd fe && npx jest src/app/admin/settings/__tests__/infra-toggles.test.tsx --verbose --no-cache', { 
    encoding: 'utf8', 
    stdio: 'pipe',
    timeout: 30000 
  });
  console.log('Frontend test output:');
  console.log(feOutput);
} catch (error) {
  console.log('Frontend test error (this might be expected):');
  console.log(error.stdout || error.message);
}

console.log('\n🔧 Running backend infraMonitoring fix test...\n');

try {
  const beOutput = execSync('cd be && npx jest test/public-settings-social-metadata-new.e2e-spec.ts --verbose --no-cache --detectOpenHandles', { 
    encoding: 'utf8', 
    stdio: 'pipe',
    timeout: 60000 
  });
  console.log('Backend test output:');
  console.log(beOutput);
} catch (error) {
  console.log('Backend test error:');
  console.log(error.stdout || error.message);
  console.log('stderr:', error.stderr || 'No stderr');
}

console.log('\n✅ Test verification complete!');
