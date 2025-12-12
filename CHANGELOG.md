# Changelog – beelms core repo

## v0.1.0 – WS-CORE-4 DX / CLI baseline

This version marks the first stable DX baseline for the beelms core repo, focused on
**WS-CORE-4 (CLI / DX / walking skeleton)**.

### Backend (be/)

- Canonicalised the wiki seed (`src/seed/wiki.seed.ts`) to use generic, hello-world style
  content instead of QA4Free-specific wording.
- Synced e2e tests with the canonical seed, making them robust to content changes and
  focused on invariants (slugs, languages, statuses).
- Added DX-friendly npm scripts in `be/package.json`:
  - `test:setup-db` → `build + migration:run + seed:wiki`.
  - `test:regression:local` → `test:setup-db` + `test` + `test:e2e` (без perf тестове).

### Frontend (fe/)

- Stabilised Jest tests for wiki/admin pages by handling ESM-only markdown dependencies:
  - Configured `jest.config.cjs` with `transformIgnorePatterns` for the markdown toolchain.
  - Added Jest mocks in `fe/test/__mocks__/` for:
    - `react-markdown` (simple wrapper that renders children).
    - `remark-gfm` and `rehype-raw` (no-op mocks).
- Ensured `npm run test` in `fe/` passes reliably on current Node/Jest/Next stack.

### CLI (tools/create-beelms-app)

- Implemented a local CLI prototype (`create-beelms-app`) that scaffolds new projects
  based on the current repo state:
  - `api/` – NestJS backend template (copied from `be/`).
  - `web/` – optional Next.js frontend template (copied from `fe/`).
  - `docker/` – generated `docker-compose.yml` with project-specific names/DB config.
  - `env/` – placeholder folder for env templates.
- Added support for `--api-only` / `--no-web` flags to skip the `web/` scaffold when
  only the backend is needed.
- Generated DX helper scripts in the scaffolded `docker/` folder:
  - `docker-test-regression-local.sh` / `.bat` → `docker compose up --build -d` +
    `docker compose exec api npm run test:regression:local`.
- Improved the generated project `README.md` with a backend quick start, and updated
  CLI console output with explicit "Next steps" (cd, npm install, test commands).

### CLI smoke tests (tools/create-beelms-app)

- Added `src/smoke.ts` and wired `npm run smoke`:
  - builds the CLI;
  - scaffolds a temporary API-only project in OS temp;
  - runs the project's Docker stack and `npm run test:regression:local` inside `api`;
  - tears down the stack with `docker compose down -v`.
- This serves as an end-to-end smoke test: **CLI → scaffold → Docker → backend regression**.

### Local "poor-man" CI

- Documented a fully local CI ritual in `docs/LOCAL_CI.md`:
  - Backend: `cd be && npm run test:regression:local`.
  - Frontend: `cd fe && npm run test`.
  - CLI smoke (optional but recommended): `cd tools/create-beelms-app && npm run smoke`.
- Provided example **git `pre-push` hooks** (Windows and Linux/macOS) that run backend
  and frontend tests before every `git push`, entirely locally (no cloud CI required).

---

This changelog entry is descriptive only – no semantic versioning or npm publishing is
assumed yet. If/when the repo is versioned or packages are published, this `v0.1.0`
entry can serve as the initial DX/CLI baseline.
