# STORY-DX-1: docker-compose dev workflow (DX)

_BMAD Story Spec | EPIC: EPIC-CORE-DX-CLI-INFRA | Status: ✅ Implemented_

---

## 1. Goal

Да има ясен и удобен локален Docker workflow за dev, който позволява:

- бърз старт на DB + API (и по избор FE) с една команда;
- миграциите да се прилагат автоматично при старт (или с ясна helper команда);
- лесен достъп до DB от host (opt-in, без port collisions);
- предвидимо управление на volumes и teardown.

---

## 2. Non-Goals

- Production/stage deployment
- Kubernetes / helm
- Multi-host orchestration

---

## 3. Acceptance Criteria

### 3.1 Compose workflow

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | `docker compose up` стартира DB + миграции + API в правилен ред | ✅ |
| AC-2 | Има documented начин за host DB access без да е default (override файл) | ✅ |
| AC-3 | Има documented начин за (re)build на API контейнера след промени по `be/` | ✅ |

### 3.2 Helper commands (DX)

| # | Criterion | Status |
|---|-----------|--------|
| AC-4 | Има copy/paste команди за common операции (up/down, rebuild api, run migrations, seed) | ✅ |
| AC-5 | Има root-level npm wrapper scripts за Docker операции (optional, nice-to-have) | ✅ |

### 3.3 Documentation

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Root README има кратка секция „Docker dev workflow“ с препоръчани команди | ✅ |

---

## 4. Current State in Codebase

- `docker-compose.yml` съдържа `db`, `migrate`, `api` с dependency ordering.
- `docker-compose.db-host.yml` публикува DB порт към host (opt-in).
- Root `README.md` съдържа „Docker dev workflow (cheatsheet)“ секция с copy/paste команди и root npm `docker:*` wrapper-и.

---

## 5. Implementation Notes

- Да се запази текущия подход с отделен `migrate` service.
- Да се добавят root npm scripts само ако не усложняват проекта.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for DX-1 |
