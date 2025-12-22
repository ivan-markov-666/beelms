# STORY-DX-2: Migrations / Seed workflow (DX)

_BMAD Story Spec | EPIC: EPIC-CORE-DX-CLI-INFRA | Status: 🟡 In Progress_

---

## 1. Goal

Да има ясен, reproducible и лесен за изпълнение workflow за:

- пускане на TypeORM миграции (run / revert / show / check)
- seed-ване на минимални демо данни (Wiki + Courses)

…както през Docker (препоръчано за локална среда), така и от host (за dev/test), без „скрити“ предпоставки.

---

## 2. Non-Goals

- Пълна CI/CD pipeline автоматизация
- Сложен seed framework (fixtures, faker, randomized data)
- Production-grade secret management

---

## 3. Acceptance Criteria

### 3.1 Root-level DX commands

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Има root-level npm scripts за run/check/show/revert миграции (wrapper към `be/`) | ✅ |
| AC-2 | Има root-level npm scripts за seed (Wiki + Courses) (wrapper към `be/`) | ✅ |

### 3.2 Seed scripts (без излишни prerequisite-и)

| # | Criterion | Status |
|---|-----------|--------|
| AC-3 | Seed може да се пусне в dev без задължителен `npm run build` (напр. чрез ts-node) | ✅ |
| AC-4 | Seed скриптовете са идемпотентни (без duplicate insert-и при повторно пускане) | ✅ |

### 3.3 TypeORM data-source completeness

| # | Criterion | Status |
|---|-----------|--------|
| AC-5 | `be/data-source.ts` съдържа всички entity-та, нужни за коректно `migration:generate` (вкл. нови домейни като Tasks) | ✅ |

### 3.4 Documentation

| # | Criterion | Status |
|---|-----------|--------|
| AC-6 | Root README има кратка секция „DB migrations & seed“ с copy/paste команди за Docker и host | ✅ |

---

## 4. Current State in Codebase

- Има TypeORM CLI wiring в `be/package.json`:
  - `migration:run`, `migration:revert`, `migration:show`, `migration:check`
- Docker има `migrate` service, който се изпълнява преди `api` (`docker-compose.yml`).
- Seed скриптове:
  - `be/src/seed/wiki.seed.ts`
  - `be/src/seed/courses.seed.ts`
  - текущо се изпълняват като compiled JS (`node dist/...`), което изисква `npm run build` ако се пускат от host.

---

## 5. Implementation Notes

- Root-level scripts трябва да са thin wrappers към `npm --prefix be run ...`.
- За seed в dev да се добавят отделни scripts (напр. `seed:wiki:dev`) които изпълняват `src/seed/*.ts` през ts-node.
- `be/data-source.ts` трябва да се поддържа синхронизиран с реално използваните entities, за да работи `migration:generate` коректно.

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for DX-2 |
