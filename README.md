# QA-Platform Monorepo

This repository is a **pnpm-powered monorepo** that hosts every service and package of the QA-Platform:

- `apps/` – runnable applications (`web`, `admin`, `api`, …)
- `packages/` – shared, reusable code (UI components, shared types, constants, …)

> The project follows the BMAD methodology and uses Windsurf as the primary AI coding assistant.

---

## Prerequisites

| Tool                           | Minimum version | Notes                             |
| ------------------------------ | --------------- | --------------------------------- |
| [Node.js](https://nodejs.org/) | 20.x            | Install via nvm / fnm if possible |
| [pnpm](https://pnpm.io/)       | 8.x             | `npm i -g pnpm`                   |
| Git                            | 2.40+           | Ensure SSH keys are configured    |

---

## 1. Clone & Install

```bash
# clone
git clone git@github.com:ivan-markov-666/qa-4-free.git
cd qa-4-free

# install all workspace dependencies
pnpm install
```

---

## 2. Useful Commands (root)

| Command                 | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `pnpm typecheck`        | Type-check all packages using the root `tsconfig.base.json`. |
| `pnpm -r run typecheck` | Type-check every workspace package individually.             |

---

## 3. Running Individual Apps

Each application under `apps/` will expose its own scripts. For example:

```bash
cd apps/web
pnpm dev      # start Vite (soon)
```

---

## 4. Development Guidelines

- **Strict TypeScript** – `strict: true` is enabled globally.
- **Branch naming** – follow `v<version>-task-<epic>-<task>` (e.g. `v4-task-1-1-3`).

---

## 5. Docker Development Environment

A complete Docker development environment is provided. This includes:

- PostgreSQL 17 database
- pgAdmin 4 for database management
- API service (NestJS)
- Public React web application
- Admin React web application

### Starting the environment

```bash
# Start all services
pnpm docker:up

# View container status
pnpm docker:ps

# View logs from all containers
pnpm docker:logs

# Stop all services
pnpm docker:down
```

### Accessing services

| Service    | URL                   | Credentials               |
| ---------- | --------------------- | ------------------------- |
| API        | http://localhost:3000 | -                         |
| Web App    | http://localhost:3001 | -                         |
| Admin App  | http://localhost:3002 | -                         |
| pgAdmin    | http://localhost:5050 | admin@example.com / admin |
| PostgreSQL | localhost:5432        | postgres / postgres       |

### Health Checks

All services include health checks. You can verify the environment is running correctly with:

```bash
pnpm test:smoke
```

See [TESTS.md](./TESTS.md) for more information about testing.

---

Happy hacking! 🎉
