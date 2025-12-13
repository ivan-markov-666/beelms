#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printUsage() {
  // Short, clear help message
  console.log("Usage: create-beelms-app <project-name>");
  console.log("");
  console.log("Example:");
  console.log("  create-beelms-app my-lms");
  console.log("");
  console.log(
    "This is a prototype CLI that scaffolds a beelms core app template (api/web/docker/env).\n" +
      "Future iterations will add template options and more configuration.",
  );
}

function isValidProjectName(name) {
  // Simple, permissive rule: letters, digits, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

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
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const projectName = args[0];

  if (!isValidProjectName(projectName)) {
    console.error(
      `Invalid project name: "${projectName}". Use only letters, digits, dashes and underscores.`,
    );
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(
      `Target directory already exists: ${targetDir}. Please choose a different project name or remove the folder.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

   // Determine the beelms core repo root relative to this CLI file
  const repoRoot = path.resolve(__dirname, "../..");

  const beSrcDir = path.join(repoRoot, "be");
  const feSrcDir = path.join(repoRoot, "fe");

  const apiTargetDir = path.join(targetDir, "api");
  const webTargetDir = path.join(targetDir, "web");
  const dockerTargetDir = path.join(targetDir, "docker");
  const envTargetDir = path.join(targetDir, "env");

  const scaffolded = [];

  if (fs.existsSync(beSrcDir) && fs.statSync(beSrcDir).isDirectory()) {
    copyDir(beSrcDir, apiTargetDir);
    scaffolded.push("api/");
  }

  if (fs.existsSync(feSrcDir) && fs.statSync(feSrcDir).isDirectory()) {
    copyDir(feSrcDir, webTargetDir);
    scaffolded.push("web/");
  }

  fs.mkdirSync(dockerTargetDir, { recursive: true });
  const dockerComposeSrc = path.join(repoRoot, "docker-compose.yml");
  const dockerComposeDest = path.join(dockerTargetDir, "docker-compose.yml");
  if (fs.existsSync(dockerComposeSrc) && fs.statSync(dockerComposeSrc).isFile()) {
    fs.copyFileSync(dockerComposeSrc, dockerComposeDest);
    scaffolded.push("docker/");
  }

  const dockerComposeDbHostSrc = path.join(repoRoot, "docker-compose.db-host.yml");
  const dockerComposeDbHostDest = path.join(
    dockerTargetDir,
    "docker-compose.db-host.yml",
  );
  if (
    fs.existsSync(dockerComposeDbHostSrc) &&
    fs.statSync(dockerComposeDbHostSrc).isFile()
  ) {
    fs.copyFileSync(dockerComposeDbHostSrc, dockerComposeDbHostDest);
  }

  fs.mkdirSync(envTargetDir, { recursive: true });
  scaffolded.push("env/");

  const readmePath = path.join(targetDir, "README.md");
  const readmeContent = `# ${projectName}\n\n` +
    `This project was bootstrapped using the experimental beelms core CLI prototype.\n\n` +
    `The CLI currently scaffolds an initial beelms core structure based on the current repo:\n` +
    `- api/ (NestJS backend template, copied from the be/ folder)\n` +
    `- web/ (optional Next.js frontend template, copied from the fe/ folder)\n` +
    `- docker/ (Docker Compose file copied from docker-compose.yml)\n` +
    `- env/ (placeholder folder for environment templates)\n\n` +
    `By default, Postgres is not published to the host (avoids port collisions). If you need host access, use:\n` +
    `   cd docker\n` +
    `   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db\n` +
    `You can optionally set DB_PORT_PUBLISHED to publish a different host port (default 5432).\n\n` +
    `For the full manual template process and how this maps to WS-CORE-1..3, see:\n` +
    `docs/sprint-artifacts/beelms-core-ws-core-4-manual-template.md in the beelms core repo.\n`;

  fs.writeFileSync(readmePath, readmeContent, { encoding: "utf8" });

  console.log("✅ beelms core CLI prototype");
  console.log("");
  console.log(`Created project folder: ${targetDir}`);
  if (scaffolded.length > 0) {
    console.log("");
    console.log("Scaffolded:");
    for (const item of scaffolded) {
      console.log(`  - ${item}`);
    }
  }
  console.log("");
  console.log("Next steps:");
  console.log("  1. Open the new folder in your IDE.");
  console.log(
    "  2. Adjust configuration, env files and Docker settings according to your new project.",
  );
  console.log(
    "  3. In future iterations, this CLI will add template options (api-only/full-stack) and more DX helpers.",
  );
}

main();
