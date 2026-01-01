#!/usr/bin/env node

/**
 * Script to clean ANSI escape codes from log files
 * Usage: node clean-logs.js <filename> [output-filename]
 */

const fs = require('fs');
const path = require('path');

// ANSI escape code regex pattern
// This matches both actual ANSI escape sequences (\x1b[...]) and display representations ([...])
const ansiRegex = /\x1b?\[[0-9;]*[a-zA-Z]/g;

function cleanAnsiCodes(content) {
  return content.replace(ansiRegex, '');
}

function cleanLogFile(inputFile, outputFile = null) {
  try {
    // Read the input file
    const content = fs.readFileSync(inputFile, 'utf8');

    // Clean ANSI codes
    const cleanedContent = cleanAnsiCodes(content);

    // Determine output file
    const finalOutputFile = outputFile || inputFile;

    // Write the cleaned content
    fs.writeFileSync(finalOutputFile, cleanedContent, 'utf8');

    console.log(`✅ Cleaned ANSI codes from ${inputFile}`);
    if (outputFile) {
      console.log(`📄 Output saved to ${outputFile}`);
    } else {
      console.log(`📄 File overwritten in-place`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${inputFile}:`, error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node clean-logs.js <filename> [output-filename]');
    console.log('');
    console.log('Examples:');
    console.log('  node clean-logs.js test-be.log                    # Clean in-place');
    console.log('  node clean-logs.js test-be.log clean-test-be.log # Clean to new file');
    console.log('  node clean-logs.js lint.log                       # Clean lint logs');
    console.log('');
    console.log('Available log files in current directory:');
    try {
      const files = fs.readdirSync('.').filter(file =>
        file.endsWith('.log') && fs.statSync(file).isFile()
      );
      if (files.length > 0) {
        files.forEach(file => console.log(`  - ${file}`));
      } else {
        console.log('  (no .log files found)');
      }
    } catch (error) {
      console.log('  (could not list files)');
    }
    return;
  }

  const inputFile = args[0];
  const outputFile = args[1] || null;

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file '${inputFile}' does not exist`);
    process.exit(1);
  }

  cleanLogFile(inputFile, outputFile);
}

// Export functions for potential use as module
module.exports = {
  cleanAnsiCodes,
  cleanLogFile
};

// Run if called directly
if (require.main === module) {
  main();
}
