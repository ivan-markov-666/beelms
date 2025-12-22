#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

function printUsage(): void {
  // Short, clear help message
  console.log(
    "Usage: create-beelms-app <project-name> [--api-only|--no-web]",
  );
  console.log("");
  console.log("Example:");
  console.log("  create-beelms-app my-lms");
  console.log("  create-beelms-app my-lms --api-only");
  console.log("");
  console.log(
    "This is a prototype CLI that scaffolds a beelms core app template (api/web/docker/env).\n" +
      "Use --api-only / --no-web to skip the web/ scaffold when you only need the backend.\n" +
      "Future iterations will add richer template options and more configuration.",
  );
}

function isValidProjectName(name: string): boolean {
  // Simple, permissive rule: letters, digits, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

const COPY_IGNORE_NAMES = new Set<string>([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

function copyDir(srcDir: string, destDir: string): void {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  const stat = fs.statSync(srcDir);
  if (!stat.isDirectory()) {
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

function toDbIdentifier(name: string): string {
  const lower = name.toLowerCase();
  const replaced = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return replaced.length > 0 ? replaced : "beelms";
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const projectName = args[0];
  const extraArgs = args.slice(1);
  const apiOnly =
    extraArgs.includes("--api-only") || extraArgs.includes("--no-web");

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

  const templatesRoot = path.resolve(__dirname, "../templates");
  const apiTemplateDir = path.join(templatesRoot, "api");
  const webTemplateDir = path.join(templatesRoot, "web");

  // Dev fallback: determine the beelms core repo root relative to the compiled dist/index.js file
  // dist/index.js -> ../.. -> create-beelms-app -> .. -> tools -> .. -> repo root
  const repoRoot = path.resolve(__dirname, "../../..");
  const beSrcDir = path.join(repoRoot, "be");
  const feSrcDir = path.join(repoRoot, "fe");

  const apiSrcDir =
    fs.existsSync(apiTemplateDir) && fs.statSync(apiTemplateDir).isDirectory()
      ? apiTemplateDir
      : beSrcDir;

  const webSrcDir =
    fs.existsSync(webTemplateDir) && fs.statSync(webTemplateDir).isDirectory()
      ? webTemplateDir
      : feSrcDir;

  const apiTargetDir = path.join(targetDir, "api");
  const webTargetDir = path.join(targetDir, "web");
  const dockerTargetDir = path.join(targetDir, "docker");
  const envTargetDir = path.join(targetDir, "env");

  const scaffolded: string[] = [];

  if (fs.existsSync(apiSrcDir) && fs.statSync(apiSrcDir).isDirectory()) {
    copyDir(apiSrcDir, apiTargetDir);
    scaffolded.push("api/");
  }

  if (!apiOnly && fs.existsSync(webSrcDir) && fs.statSync(webSrcDir).isDirectory()) {
    copyDir(webSrcDir, webTargetDir);
    scaffolded.push("web/");
  }

  if (!apiOnly && fs.existsSync(webTargetDir) && fs.statSync(webTargetDir).isDirectory()) {
    const webDockerfilePath = path.join(webTargetDir, "Dockerfile");
    if (!fs.existsSync(webDockerfilePath)) {
      const webDockerfileContent = `FROM node:24-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-p", "3000", "-H", "0.0.0.0"]
`;

      fs.writeFileSync(webDockerfilePath, webDockerfileContent, { encoding: "utf8" });
    }

    const nextConfigPath = path.join(webTargetDir, "next.config.ts");
    if (fs.existsSync(nextConfigPath) && fs.statSync(nextConfigPath).isFile()) {
      const nextConfigContent = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiInternalBaseUrl =
      process.env.API_INTERNAL_BASE_URL ?? "http://localhost:3000";

    return [
      {
        source: "/wiki/media/:path*",
        destination: apiInternalBaseUrl + "/wiki/media/:path*",
      },
    ];
  },
};

export default nextConfig;
`;

      fs.writeFileSync(nextConfigPath, nextConfigContent, { encoding: "utf8" });
    }
  }

  fs.mkdirSync(dockerTargetDir, { recursive: true });
  const dbName = toDbIdentifier(projectName);
  const dockerComposeWebService = apiOnly
    ? ""
    : `

  web:
    build:
      context: ../web
      dockerfile: Dockerfile
    container_name: ${projectName}-web
    restart: unless-stopped
    profiles:
      - web
    depends_on:
      - api
    environment:
      NODE_ENV: development
      PORT: 3000
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3000/api
      API_INTERNAL_BASE_URL: http://api:3000
    networks:
      - app-net
    ports:
      - "3001:3000"`;

  const dockerComposeContent = `services:
  db:
    image: postgres:16-alpine
    container_name: ${projectName}-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: ${dbName}
      POSTGRES_PASSWORD: ${dbName}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbName} -d ${dbName}"]
      interval: 5s
      timeout: 5s
      retries: 20
    networks:
      - app-net
    volumes:
      - db-data:/var/lib/postgresql/data

  migrate:
    build:
      context: ../api
      dockerfile: Dockerfile
    container_name: ${projectName}-migrate
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: development
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${dbName}
      DB_USER: ${dbName}
      DB_PASSWORD: ${dbName}
    networks:
      - app-net
    command: ["sh", "-c", "npm run migration:run && npm run migration:check"]

  redis:
    image: redis:7-alpine
    container_name: ${projectName}-redis
    restart: unless-stopped
    profiles:
      - redis
    networks:
      - app-net
    volumes:
      - redis-data:/data

  api:
    build:
      context: ../api
      dockerfile: Dockerfile
    container_name: ${projectName}-api
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    environment:
      NODE_ENV: development
      PORT: 3000
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${dbName}
      DB_USER: ${dbName}
      DB_PASSWORD: ${dbName}
      MEDIA_ROOT: /usr/src/app/media
    networks:
      - app-net
    ports:
      - "3000:3000"
    volumes:
      - wiki-media:/usr/src/app/media

${dockerComposeWebService}

volumes:
  db-data:
    name: ${projectName}-db-data
  wiki-media:
    name: ${projectName}-wiki-media
  redis-data:
    name: ${projectName}-redis-data

networks:
  app-net:
    name: ${projectName}-net
`;

  fs.writeFileSync(
    path.join(dockerTargetDir, "docker-compose.yml"),
    dockerComposeContent,
    { encoding: "utf8" },
  );

  const dockerComposeDbHostContent = `services:
  db:
    ports:
      - "\${DB_PORT_PUBLISHED:-5432}:5432"
`;

  fs.writeFileSync(
    path.join(dockerTargetDir, "docker-compose.db-host.yml"),
    dockerComposeDbHostContent,
    { encoding: "utf8" },
  );

  const dockerScriptSh = `#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

docker compose up --build -d
docker compose exec api npm run test:regression:local
`;

  fs.writeFileSync(
    path.join(dockerTargetDir, "docker-test-regression-local.sh"),
    dockerScriptSh,
    { encoding: "utf8" },
  );

  const dockerScriptBat = `@echo off
setlocal
cd /d %~dp0
docker compose up --build -d
docker compose exec api npm run test:regression:local
endlocal
`;

  fs.writeFileSync(
    path.join(dockerTargetDir, "docker-test-regression-local.bat"),
    dockerScriptBat,
    { encoding: "utf8" },
  );

  scaffolded.push("docker/");

  fs.mkdirSync(envTargetDir, { recursive: true });

  const apiEnvExamplePath = path.join(envTargetDir, ".env.example.api");
  const apiEnvExampleContent = `# Backend (.env for NestJS API)\n` +
    `NODE_ENV=development\n` +
    `PORT=3000\n` +
    `\n` +
    `# Database connection (used by TypeORM and seed scripts)\n` +
    `DB_HOST=localhost\n` +
    `DB_PORT=5432\n` +
    `DB_NAME=${dbName}\n` +
    `DB_USER=${dbName}\n` +
    `DB_PASSWORD=${dbName}\n` +
    `\n` +
    `# CORS / frontend origin\n` +
    `FRONTEND_ORIGIN=http://localhost:3001\n` +
    `\n` +
    `# Auth & security (development defaults – change for real deployments)\n` +
    `JWT_SECRET=dev_jwt_secret_change_me\n` +
    `JWT_EXPIRES_IN=900s\n` +
    `AUTH_REQUIRE_CAPTCHA=false\n` +
    `ACCOUNT_EXPORT_REQUIRE_CAPTCHA=false\n`;

  fs.writeFileSync(apiEnvExamplePath, apiEnvExampleContent, {
    encoding: "utf8",
  });

  const dbEnvExamplePath = path.join(envTargetDir, ".env.example.db");
  const dbEnvExampleContent = `# Database container env (Postgres)\n` +
    `POSTGRES_DB=${dbName}\n` +
    `POSTGRES_USER=${dbName}\n` +
    `POSTGRES_PASSWORD=${dbName}\n`;

  fs.writeFileSync(dbEnvExamplePath, dbEnvExampleContent, {
    encoding: "utf8",
  });

  if (!apiOnly) {
    const webEnvExamplePath = path.join(envTargetDir, ".env.example.web");
    const webEnvExampleContent = `# Frontend (.env for Next.js app)\n` +
      `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api\n` +
      `API_INTERNAL_BASE_URL=http://localhost:3000\n`;

    fs.writeFileSync(webEnvExamplePath, webEnvExampleContent, {
      encoding: "utf8",
    });
  }

  scaffolded.push("env/");

  const readmePath = path.join(targetDir, "README.md");
  const readmeContent = `# ${projectName}\n\n` +
    `This project was bootstrapped using the experimental beelms core CLI prototype.\n\n` +
    `The CLI currently scaffolds an initial beelms core structure based on the current repo:\n` +
    `- api/ (NestJS backend template, copied from the be/ folder)\n` +
    `- web/ (optional Next.js frontend template, copied from the fe/ folder)\n` +
    `- docker/ (Docker Compose file generated by the CLI)\n` +
    `- env/ (placeholder folder for environment templates)\n\n` +
    `## Docker (optional web + redis)\n\n` +
    `The generated Docker stack can optionally include a Next.js web service and a Redis service via Compose profiles:\n` +
    `- Start API + DB only (default):\n` +
    `   cd docker\n` +
    `   docker compose up --build -d\n\n` +
    `- Start full stack (web + redis):\n` +
    `   cd docker\n` +
    `   docker compose --profile web --profile redis up --build -d\n\n` +
    `By default, Postgres is not published to the host (avoids port collisions). If you need host access (psql, running api locally), use:\n` +
    `   cd docker\n` +
    `   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db\n` +
    `You can optionally set DB_PORT_PUBLISHED to publish a different host port (default 5432).\n\n` +
    `## Backend (api/) quick start\n\n` +
    `1. Install dependencies:\n` +
    `   cd api\n` +
    `   npm install\n\n` +
    `2. If you want to run the API locally (without Docker), make sure Postgres is running and then apply migrations + seeds:\n` +
    `   npm run migration:run\n` +
    `   npm run migration:check\n` +
    `   npm run seed:wiki:dev\n` +
    `   npm run seed:courses:dev\n\n` +
    `3. Run the API in dev mode:\n` +
    `   npm run start:dev\n\n` +
    `4. Run tests (local):\n` +
    `   npm run test:regression:local\n`;

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
  console.log(`  1. cd ${projectName}`);
  console.log("  2. cd api");
  console.log("  3. npm install");
  console.log("  4. npm run test:setup-db");
  console.log("  5. npm run test:regression:local");
  console.log("");
  console.log(
    "These steps will run migrations, apply the canonical wiki seed and execute unit + e2e tests.",
  );
}

main();
