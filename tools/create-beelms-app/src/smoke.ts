import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawnSync } from "child_process";

function runOrFail(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function main(): void {
  const repoRoot = path.resolve(__dirname, "../../../");

  const tmpBase = fs.mkdtempSync(
    path.join(os.tmpdir(), "beelms-cli-smoke-"),
  );

  const projectName = `cli-smoke-${Date.now()}`;
  const projectRoot = path.join(tmpBase, projectName);

  console.log("[smoke] Repo root:", repoRoot);
  console.log("[smoke] Temp base:", tmpBase);
  console.log("[smoke] Project root:", projectRoot);

  // 1) Scaffold new project with CLI (API-only is enough for the smoke)
  console.log("[smoke] Scaffolding project with CLI...");
  runOrFail(
    "node",
    [
      path.join(repoRoot, "tools", "create-beelms-app", "dist", "index.js"),
      projectName,
      "--api-only",
    ],
    tmpBase,
  );

  const dockerDir = path.join(projectRoot, "docker");

  if (!fs.existsSync(dockerDir)) {
    throw new Error(
      `[smoke] Expected docker folder not found: ${dockerDir}. CLI scaffold may have failed.`,
    );
  }

  const dockerComposePath = path.join(dockerDir, "docker-compose.yml");
  if (!fs.existsSync(dockerComposePath)) {
    throw new Error(
      `[smoke] Expected docker-compose.yml not found: ${dockerComposePath}. CLI scaffold may have failed.`,
    );
  }

  const dockerComposeContent = fs.readFileSync(dockerComposePath, {
    encoding: "utf8",
  });

  if (dockerComposeContent.includes('"5432:5432"')) {
    throw new Error(
      "[smoke] Expected db port NOT to be published by default in docker-compose.yml, but found '5432:5432'.",
    );
  }

  const dockerComposeDbHostPath = path.join(
    dockerDir,
    "docker-compose.db-host.yml",
  );
  if (!fs.existsSync(dockerComposeDbHostPath)) {
    throw new Error(
      `[smoke] Expected docker-compose.db-host.yml not found: ${dockerComposeDbHostPath}. CLI scaffold may have failed.`,
    );
  }

  const dockerComposeDbHostContent = fs.readFileSync(dockerComposeDbHostPath, {
    encoding: "utf8",
  });

  if (!dockerComposeDbHostContent.includes("DB_PORT_PUBLISHED")) {
    throw new Error(
      "[smoke] Expected docker-compose.db-host.yml to reference DB_PORT_PUBLISHED, but it does not.",
    );
  }

  console.log("[smoke] Using docker directory:", dockerDir);
  const composeArgs = ["compose", "-p", projectName];

  try {
    // 2) Bring up the Docker stack
    console.log(
      `[smoke] Running: docker compose -p ${projectName} up -d db`,
    );
    runOrFail("docker", [...composeArgs, "up", "-d", "db"], dockerDir);

    // 3) Run regression local (build + migrations + seed + unit + e2e)
    console.log(
      `[smoke] Running: docker compose -p ${projectName} run --rm --build api npm run test:regression:local`,
    );
    runOrFail(
      "docker",
      [
        ...composeArgs,
        "run",
        "--rm",
        "--build",
        "api",
        "npm",
        "run",
        "test:regression:local",
      ],
      dockerDir,
    );

    console.log("[smoke] SUCCESS – CLI scaffold + Docker stack + regression local.");
  } finally {
    console.log("[smoke] Tearing down docker compose stack (docker compose down -v)...");
    spawnSync("docker", [...composeArgs, "down", "-v"], {
      cwd: dockerDir,
      stdio: "inherit",
    });
  }
}

main();
