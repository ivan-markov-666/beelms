# Локален "poor-man" CI за beelms core
 
Този документ описва **изцяло локален, без cloud** CI ритуал за това репо. Идеята е да се изпълнява
ръчно (и по избор през git hook-ове) преди push на важни промени към `main`.
 
Целта е да се валидира, че:
 
- backend-ът (be/) build-ва, прилага миграции, seed-ва wiki данни и минава unit + e2e тестове;
- frontend-ът (fe/) минава Jest тестовете си;
- CLI-то (tools/create-beelms-app) може да scaffold-не нов проект и да пусне regression тестове през Docker.
 
---
 
## 1. Backend (be/) regression
 
От root-а на репото:
 
```bash
cd be
npm run test:regression:local
```
 
`test:regression:local` прави:
 
1. `test:setup-db` → `build + migration:run + seed:wiki` към конфигурираната DB.
2. `test` → unit тестове.
3. `test:e2e` → e2e тестове (без perf).
 
Можеш да го пуснеш срещу локален Postgres или през Docker стека под `be/docker/`.
 
---
 
## 2. Frontend (fe/) tests
 
От root-а на репото:
 
```bash
cd fe
npm run test
```
 
Това стартира всички React/Jest тестове, включително admin + wiki флоу-ове.
 
---
 
## 3. CLI + Docker walking skeleton smoke (tools/create-beelms-app)
 
От root-а на репото:
 
```bash
cd tools/create-beelms-app
npm run smoke
```
 
`npm run smoke` ще:
 
1. Build-не CLI-то (`npm run build`).
2. Създаде **временен** проект в temp директорията на ОС чрез CLI-то (API-only).
3. В `docker/` папката на новия проект:
   - стартира `docker compose up --build -d`;
   - стартира `docker compose exec api npm run test:regression:local`.
4. Накрая стартира `docker compose down -v`, за да спре и изтрие ресурсите.
 
Ако `npm run smoke` мине успешно, това доказва, че:
 
- CLI-то може да scaffold-не нов проект;
- Docker стекът за този проект работи;
- backend regression флоу-ът (`test:regression:local`) минава вътре в контейнера.
 
### 3.1. Ползване на CLI-то локално без npm publish (tarball workflow)
 
Пакетът `create-beelms-app` **още не е публикуван** в npm registry, така че `npx create-beelms-app ...` няма да работи.
 
Използвай `npm pack`, за да генерираш локален `.tgz` tarball и да го стартираш през `npx`.
 
1) Генерирай tarball:
 
```bash
cd tools/create-beelms-app
npm ci
npm pack
```
 
2) Scaffold-ни проект от tarball-а (препоръчително е да се използва **абсолютен път**):
 
```bash
# Example (Windows)
npx --yes --package "C:\\path\\to\\repo\\tools\\create-beelms-app\\create-beelms-app-0.1.0.tgz" create-beelms-app my-lms
```
 
> Бележка: Под Windows относителните `file:` / `..\...tgz` пътища могат да се резолвнат спрямо най-близкия parent `package.json`. Абсолютният път избягва този проблем.
 
3) Стартирай Docker стека за scaffold-натия проект:
 
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
 
## 4. Препоръчан локален CI ритуал
 
Преди push към `main` или преди release, стартирай:
 
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
 
Ако и трите команди минат успешно, имаш силен локален сигнал, че целият stack е здрав.
 
---
 
## 5. По избор: git pre-push hook
 
Можеш да настроиш **локален** git `pre-push` hook, така че backend + frontend тестовете да се пускат автоматично
преди всеки `git push`. Това остава изцяло локално и не използва cloud CI.
 
### 5.1. Linux/macOS pre-push hook (bash)
 
Създай `.git/hooks/pre-push` със следното съдържание:
 
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
 
После го направи executable:
 
```bash
chmod +x .git/hooks/pre-push
```
 
### 5.2. Windows pre-push hook (cmd)
 
Създай `.git/hooks/pre-push` със следното съдържание:
 
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
