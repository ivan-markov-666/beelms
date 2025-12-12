import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const target = path.resolve(__dirname, "../dist/index.js");

  if (!fs.existsSync(target)) {
    throw new Error(`Expected compiled CLI entry not found: ${target}`);
  }

  const content = fs.readFileSync(target, { encoding: "utf8" });

  if (content.startsWith("#!/usr/bin/env node")) {
    return;
  }

  fs.writeFileSync(target, `#!/usr/bin/env node\n\n${content}`, {
    encoding: "utf8",
  });
}

main();
