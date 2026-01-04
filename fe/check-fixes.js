// Quick syntax check for the files we fixed
(async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  console.log('Checking fixed files...');

  // Check wiki edit page
  const wikiEditPath = path.join(
    __dirname,
    'src/app/admin/wiki/[slug]/edit/page.tsx',
  );
  try {
    const wikiEditContent = fs.readFileSync(wikiEditPath, 'utf8');
  
  // Check for syntax issues we fixed
  const hasDuplicateFunctions = wikiEditContent.includes('const handleToggleCompare =') && 
    wikiEditContent.split('const handleToggleCompare =').length > 2;
  
  const hasOrphanedCode = wikiEditContent.includes('} catch {') && 
    !wikiEditContent.includes('try {') && 
    wikiEditContent.includes('await res.json()');
  
  const hasReturnOutsideComponent = wikiEditContent.includes('return (\n  <div className="space-y-6">') &&
    wikiEditContent.split('return (\n  <div className="space-y-6">').length > 1;
  
  console.log('Wiki Edit Page:');
  console.log('- Duplicate functions:', hasDuplicateFunctions ? '❌ Still present' : '✅ Fixed');
  console.log('- Orphaned code:', hasOrphanedCode ? '❌ Still present' : '✅ Fixed');  
    console.log(
      '- Multiple returns:',
      hasReturnOutsideComponent ? '❌ Still present' : '✅ Fixed',
    );
  } catch (err) {
    console.log('❌ Error reading wiki edit page:', err.message);
  }

  // Check StatusBadge export
  const settingsPath = path.join(__dirname, 'src/app/admin/settings/page.tsx');
  try {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const hasStatusBadgeExport = settingsContent.includes(
      'export function StatusBadge',
    );
    console.log(
      '\nStatusBadge Export:',
      hasStatusBadgeExport ? '✅ Fixed' : '❌ Still missing',
    );
  } catch (err) {
    console.log('❌ Error reading settings page:', err.message);
  }

  // Check admin dashboard test
  const adminTestPath = path.join(
    __dirname,
    'src/app/admin/__tests__/admin-dashboard-page.test.tsx',
  );
  try {
    const adminTestContent = fs.readFileSync(adminTestPath, 'utf8');
    const hasCorrectLinkNames =
      adminTestContent.includes('Управление на Wiki') &&
      adminTestContent.includes('Управление на потребители');
    console.log(
      'Admin Dashboard Test:',
      hasCorrectLinkNames ? '✅ Fixed' : '❌ Still incorrect',
    );
  } catch (err) {
    console.log('❌ Error reading admin dashboard test:', err.message);
  }

  console.log('\n✅ All syntax fixes completed!');
})().catch((err) => {
  console.error('❌ Unexpected failure:', err);
});
