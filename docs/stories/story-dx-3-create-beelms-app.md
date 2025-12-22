# STORY-DX-3: create-beelms-app (CLI scaffold)

_BMAD Story Spec | EPIC: EPIC-CORE-DX-CLI-INFRA | Status: ✅ Implemented_

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

- CLI: `tools/create-beelms-app`.
- Templates се синхронизират при `prepack` чрез `scripts/sync-templates.mjs`.
- `smoke.ts` scaffold-ва API-only проект (с `--api-only`) и пуска regression suite през Docker.
- Генерираният `docker/docker-compose.yml` включва `db` healthcheck, `migrate` service и `api` → чака `migrate`.
- Generated `README.md` описва docker up + migrate + seed + test flow.
- `npm pack` пакетира CLI + templates (без да дърпа core repo).

---

## 5. Implementation Notes

- Поддържай parity между core `docker-compose.yml` и генерирания шаблон (healthcheck/migrate chain).
- `copyDir` пропуска `node_modules`, `dist`, `coverage`, `.env.local`, `.DS_Store` и др.
- Smoke тестът е Windows-friendly; ако добавяме нови template assets, обнови `smoke.ts` assertions.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for DX-3 |
| 2025-12-22 | Cascade | CLI stabilized (help/validation, compose, smoke), marked as implemented |
