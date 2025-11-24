const fs = require('fs');
const path = require('path');

// Directory with sandbox-*.html files (run this script from that folder)
const dir = __dirname;

// Regex to match the whole <aside ...>...</aside> block for the left sidebar
// It assumes the aside starts with class="w-full lg:w-64 flex-shrink-0".
const ASIDE_REGEX = /<aside class="w-full lg:w-64 flex-shrink-0"[\s\S]*?<\/aside>/;

const REPLACEMENT = '<aside class="w-full lg:w-64 flex-shrink-0" data-sandbox-nav></aside>';

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;

  if (!ASIDE_REGEX.test(content)) {
    return false; // nothing to change
  }

  content = content.replace(ASIDE_REGEX, REPLACEMENT);

  if (content !== before) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.html') && f.startsWith('sandbox-'));

for (const file of files) {
  const fullPath = path.join(dir, file);
  const changed = cleanFile(fullPath);
  if (changed) {
    console.log('Updated', file);
  }
}

console.log('Done.');
