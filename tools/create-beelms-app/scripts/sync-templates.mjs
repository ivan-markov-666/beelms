import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COPY_IGNORE_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (COPY_IGNORE_NAMES.has(entry.name)) {
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".log")) {
      continue;
    }

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const templatesRoot = path.resolve(__dirname, "../templates");

  const beSrcDir = path.join(repoRoot, "be");
  const feSrcDir = path.join(repoRoot, "fe");

  const apiDestDir = path.join(templatesRoot, "api");
  const webDestDir = path.join(templatesRoot, "web");

  if (!fs.existsSync(beSrcDir) || !fs.statSync(beSrcDir).isDirectory()) {
    throw new Error(`Expected backend template folder not found: ${beSrcDir}`);
  }

  if (!fs.existsSync(feSrcDir) || !fs.statSync(feSrcDir).isDirectory()) {
    throw new Error(`Expected frontend template folder not found: ${feSrcDir}`);
  }

  fs.rmSync(templatesRoot, { recursive: true, force: true });
  fs.mkdirSync(templatesRoot, { recursive: true });

  copyDir(beSrcDir, apiDestDir);
  copyDir(feSrcDir, webDestDir);

  console.log(`[sync-templates] Synced templates into: ${templatesRoot}`);
}

main();
