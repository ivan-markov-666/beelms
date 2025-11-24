const fs = require('fs');
const path = require('path');

const dir = __dirname;
const FROM = '<script src="layout.js"></script>';
const TO = '<script src="../layout.js"></script>';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(FROM)) return false;
  const updated = content.replace(FROM, TO);
  if (updated === content) return false;
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.html') && f.startsWith('sandbox-'));

for (const file of files) {
  const full = path.join(dir, file);
  if (fixFile(full)) {
    console.log('Updated', file);
  }
}

console.log('Done.');
