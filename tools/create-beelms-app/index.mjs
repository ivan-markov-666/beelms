#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const require = createRequire(import.meta.url);
  const distEntry = path.join(__dirname, "dist", "index.js");
  if (!fs.existsSync(distEntry) || !fs.statSync(distEntry).isFile()) {
    console.error(`Expected compiled CLI entry not found: ${distEntry}`);
    console.error("Run: npm run build");
    process.exit(1);
  }

  require(distEntry);
}

main();
