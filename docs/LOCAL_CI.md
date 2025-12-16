# Local "poor-man" CI for beelms core

This document describes a **fully local, zero-cloud** CI ritual for this repo. It is meant to be
run manually (and optionally via git hooks) before pushing important changes to `main`.

The goal is to verify that:

- the backend (be/) builds, migrates its DB, seeds wiki data and passes unit + e2e tests;
- the frontend (fe/) passes its Jest tests;
- the CLI (tools/create-beelms-app) can scaffold a new project and run regression tests via Docker.

---

## 1. Backend (be/) regression

From the repo root:

```bash
cd be
npm run test:regression:local
```

`test:regression:local` does:

1. `test:setup-db` → `build + migration:run + seed:wiki` toward the configured DB.
2. `test` → unit tests.
3. `test:e2e` → e2e tests (no perf).

You can run this against a local Postgres or via the Docker stack under `be/docker/`.

---

## 2. Frontend (fe/) tests

From the repo root:

```bash
cd fe
npm run test
```

This runs all React/Jest tests, including admin + wiki flows.

---

## 3. CLI + Docker walking skeleton smoke (tools/create-beelms-app)

From the repo root:

```bash
cd tools/create-beelms-app
npm run smoke
```

`npm run smoke` will:

1. Build the CLI (`npm run build`).
2. Create a **temporary** project in the OS temp folder via the CLI (API-only).
3. In the new project's `docker/` folder:
   - run `docker compose up --build -d`;
   - run `docker compose exec api npm run test:regression:local`.
4. Finally run `docker compose down -v` to tear everything down.

If `npm run smoke` succeeds, it proves that:

- the CLI can scaffold a new project;
- the Docker stack for that project works;
- the backend regression flow (`test:regression:local`) passes inside the container.

### 3.1. Using the CLI locally without npm publish (tarball workflow)

The `create-beelms-app` package is **not published** to the npm registry yet, so `npx create-beelms-app ...` will not work.

Use `npm pack` to produce a local `.tgz` tarball and run it via `npx`.

1) Build a tarball:

```bash
cd tools/create-beelms-app
npm ci
npm pack
```

2) Scaffold a project from the tarball (recommended to use an **absolute path**):

```bash
# Example (Windows)
npx --yes --package "C:\\path\\to\\repo\\tools\\create-beelms-app\\create-beelms-app-0.1.0.tgz" create-beelms-app my-lms
```

> Note: On Windows, relative `file:` / `..\\...tgz` paths can be resolved against the nearest parent `package.json`. Using an absolute path avoids this.

3) Run the Docker stack for the scaffolded project:

```bash
cd my-lms/docker

# Default stack (api + db)
docker compose up --build -d

# Full stack (api + db + web + redis)
docker compose --profile web --profile redis up --build -d
```

4) Cleanup:

```bash
docker compose down -v
```

---

## 4. Suggested local CI ritual

Before pushing to `main` or cutting a release, run:

```bash
# Backend
cd be
npm run test:regression:local

# Frontend
cd ../fe
npm run test

# CLI + Docker smoke (optional but recommended before releases)
cd ../tools/create-beelms-app
npm run smoke
```

If all three commands succeed, you have a strong local signal that the whole stack is healthy.

---

## 5. Optional: git pre-push hook

You can wire a **local** git `pre-push` hook so that backend + frontend tests run automatically
before every `git push`. This remains fully local and does not use any cloud CI.

### 5.1. Linux/macOS pre-push hook (bash)

Create `.git/hooks/pre-push` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_ROOT/be"
echo "[pre-push] Running backend regression (test:regression:local)..."
npm run test:regression:local

cd "$REPO_ROOT/fe"
echo "[pre-push] Running frontend tests (npm run test)..."
npm run test

echo "[pre-push] All checks passed. Proceeding with push."
```

Then make it executable:

```bash
chmod +x .git/hooks/pre-push
```

### 5.2. Windows pre-push hook (cmd)

Create `.git/hooks/pre-push` with:

```bat
@echo off
setlocal

REM Determine repo root as the parent of .git
cd /d %~dp0\..
cd ..
set REPO_ROOT=%CD%

echo [pre-push] Running backend regression (test:regression:local)...
cd /d %REPO_ROOT%\be
npm run test:regression:local || goto :fail

echo [pre-push] Running frontend tests (npm run test)...
cd /d %REPO_ROOT%\fe
npm run test || goto :fail

echo [pre-push] All checks passed. Proceeding with push.
endlocal
exit /b 0

:fail
echo [pre-push] Checks failed. Aborting push.
endlocal
exit /b 1
```

> Забележка: Git под Windows ще изпълни `.git/hooks/pre-push` с `sh`, ако е shell скрипт, или
> с `cmd.exe`, ако е `.bat`. За максимална съвместимост можеш да използваш само единия вариант
> според това дали работиш основно през Git Bash или през cmd/PowerShell.

Тези hook-ове са **изцяло локални** – ако не искаш да ги ползваш, просто изтрий или преименувай
`.git/hooks/pre-push`.
