# STORY-DX-2: Migrations / Seed workflow (DX)

_BMAD Story Spec | EPIC: EPIC-CORE-DX-CLI-INFRA | Status: ✅ Implemented_

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

- Root-level npm scripts: `npm run db:migrate`, `db:migrate:revert`, `db:migrate:show`, `db:migrate:check`, `db:seed`, `db:seed:wiki`, `db:seed:courses` (thin wrappers към `be/`).
- Docker `migrate` service гарантира миграциите да вървят преди API (`docker-compose.yml`).
- Seed scripts:
  - `be/src/seed/wiki.seed.ts`
  - `be/src/seed/courses.seed.ts`
  - `package.json` има `seed:wiki:dev` и `seed:courses:dev`, които ползват ts-node → няма нужда от `npm run build`.
- Seeds са идемпотентни (използват `onConflict`/checks вътре в repo).
- `be/data-source.ts` включва всички entity-та (Courses, Tasks, Quizzes, др.), така че `migration:generate` покрива целия модел.
- `README.md` има секция “DB migrations & seed” с copy/paste команди за Docker и host.

---

## 5. Implementation Notes

- Поддържай wrapper скриптовете синхронизирани с `be/package.json`, когато добавяме нови миграционни/seed команди.
- При добавяне на нови entity-та → актуализирай `be/data-source.ts` преди `migration:generate`.
- Ако се появят нови seed сценарии, следвай същия шаблон (`seed:<name>:dev` → ts-node, `seed:<name>` → dist).

---

## 6. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | Cascade | Created story spec for DX-2 |
| 2025-12-22 | Cascade | Marked ACs as done (scripts + docs shipped) |
