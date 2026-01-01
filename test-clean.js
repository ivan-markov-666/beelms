const ansiRegex = /\[[0-9;]*[a-zA-Z]/g;

function cleanAnsiCodes(content) {
  return content.replace(ansiRegex, '');
}

const testString = '[90m[4mquery:[24m[39m [94mSELECT[0m [95mversion[0m[37m([0m[37m)[0m';

console.log('Original:', testString);
console.log('Cleaned:', cleanAnsiCodes(testString));

const fs = require('fs');
fs.writeFileSync('test-clean-result.txt', cleanAnsiCodes(testString), 'utf8');
