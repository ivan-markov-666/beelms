# STORY-DX-3: create-beelms-app (CLI scaffold)

_BMAD Story Spec | EPIC: EPIC-CORE-DX-CLI-INFRA | Status: 🟡 In Progress_

---

## 1. Goal

Да се стабилизира и документира прототипният CLI `create-beelms-app`, така че да може надеждно да scaffold-ва нов beelms core проект (API + optional Web) с Docker workflow, който работи “out of the box”.

---

## 2. Non-Goals

- Пълен production-ready генератор (публикуване в npm registry, telemetry, сложни интерактивни prompt-и)
- Генериране на различни варианти на архитектура / модули (multiple templates)

---

## 3. Acceptance Criteria

### 3.1 CLI usability

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | CLI има ясна `--help` инструкция и валидира входните параметри | ✅ |
| AC-2 | `--api-only` / `--no-web` създава проект без `web/` | ✅ |

### 3.2 Scaffold output correctness

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | Генерираният Docker Compose има deterministic DB startup (healthcheck + dependency ordering) | ✅ |
| AC-4 | Генерираният Docker Compose стартира миграции преди API (migrate service, както в core repo) | ✅ |
| AC-5 | Генерираният project `README.md` описва minimal steps за старт (docker up + seed + tests) | ✅ |

### 3.3 Packaging & templates

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | `npm pack`/`prepack` гарантира, че `templates/` се включва и CLI работи и извън monorepo (без fallback към `be/`/`fe/`) | ✅ |

### 3.4 Smoke test

| # | Criterion | Status |
|---|-----------|--------|
| AC-7 | `npm --prefix tools/create-beelms-app run smoke` минава стабилно (Windows-friendly) | ✅ |

---

## 4. Current State in Codebase

- CLI е в `tools/create-beelms-app`.
- Templates се синхронизират при `prepack` чрез `scripts/sync-templates.mjs`.
- `smoke.ts` scaffold-ва API-only проект и пуска regression suite през Docker.
- Генерираният `docker/docker-compose.yml` включва `db` healthcheck и `migrate` service, като `api` изчаква `migrate`.

---

## 5. Implementation Notes

- Prefer: да се align-не генерираният compose с root `docker-compose.yml` (db healthcheck + migrate service + api depends_on condition).
- `copyDir` трябва да избягва copying на локални артефакти (node_modules, dist, coverage и др.) и потенциални local env файлове.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for DX-3 |
