# EPIC-WS1-WIKI-BE – Wiki API + база данни (Backend за WS-1)

## Summary
Този epic обхваща backend и DB частта на walking skeleton WS-1: NestJS API, което предоставя публични ендпойнти за списък от Wiki статии и детайл по `slug`, стъпващи на реална PostgreSQL база и моделите `WikiArticle` и `WikiArticleVersion`.

## Scope (какво покрива този epic)
- NestJS `WikiModule` с контролер и услуга.
- Ендпойнти:
  - `GET /api/wiki/articles` – списък от активни статии.
  - `GET /api/wiki/articles/{slug}` – детайл за конкретна статия.
- TypeORM модели/репозита за `WikiArticle` и `WikiArticleVersion`.
- Миграции за създаване на нужните таблици и началeн seed с примерни статии.
- Този epic **не** покрива (out of scope):
  - Административен UI за създаване/редакция на Wiki статии.
  - Сложни workflow-и за одобрение и версии на съдържанието.
  - RBAC/permissions за управление на Wiki съдържание.
  - Performance оптимизации и кеширане извън базовото поведение, нужно за WS-1.
  - Разширени BE разширения за търсене/филтриране и езикова поддръжка за пълния `EPIC-WIKI-PUBLIC` (реализират се в отделни MVP stories извън WS-1).

## Related BMAD artifacts
- System Architecture – `docs/architecture/system-architecture.md` (компоненти за Wiki услугата).
- DB модел – `docs/architecture/db-model.md` (ентитети `WikiArticle` и `WikiArticleVersion`).
- OpenAPI – `docs/architecture/openapi.yaml` (пътища `GET /api/wiki/articles` и `GET /api/wiki/articles/{slug}`).
- Walking skeleton – `docs/delivery/walking-skeleton.md` §2.3.2 и §2.3.3.
- Product Brief – `docs/product/product-brief.md` (общ контекст и цели за QA платформата и Wiki).
- PRD – `docs/product/prd.md` (функционални изисквания за Wiki/knowledge base частта, ако са налични).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` §5 (FR-WIKI → EPIC → Story traceability).

## Child user stories
- [ ] STORY-WS1-BE-WIKI-LIST-ENDPOINT – `GET /api/wiki/articles` връща списък от активни Wiki статии.
- [ ] STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT – `GET /api/wiki/articles/{slug}` връща детайл за конкретна статия или 404.
- [ ] STORY-WS1-BE-WIKI-DB-SEED – Миграции и seed данни за WikiArticle/WikiArticleVersion.

## Risks / Assumptions
- **Risks:**
  - Промени в DB модела за Wiki след началото на имплементацията могат да изискват rework на миграции и seed данни.
  - Възможни несъответствия между нуждите на frontend-а и първоначалната OpenAPI спецификация за Wiki ендпойнтите.
- **Assumptions:**
  - За WS-1 са нужни само read-only `GET` ендпойнти за Wiki (без create/edit/delete).
  - Wiki функционалността в WS-1 не включва административен интерфейс и сложни workflow-и за одобрение.
  - За публичните ендпойнти в WS-1 се използва **последната публикувана езикова версия** на статията за съответния език (напр. `is_published = true` и най-нов `version_number`). Детайлната логика за управление на версиите (rollback, diff, изтриване на стари версии) се доуточнява в Admin EPIC-ите.
  - Основните продуктови изисквания за Wiki няма да претърпят значителни промени в рамките на този epic.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Ендпойнтите отговарят на OpenAPI спецификацията и са достъпни през локалната dev среда.
- Данните за Wiki се четат от реална PostgreSQL база (не от in-memory mock), с коректен филтър по `status = active`.
- Съществуват базови unit/integration тестове за WikiService/WikiController.
- Ръчно е проверено, че frontend-ът на WS-1 може да използва тези ендпойнти без допълнителни промени по API.
- Реализираното поведение за Wiki ендпойнтите съответства на релевантните секции в PRD и архитектурните материали.
- Няма отворени критични (P0/P1) дефекти, свързани с този epic.
