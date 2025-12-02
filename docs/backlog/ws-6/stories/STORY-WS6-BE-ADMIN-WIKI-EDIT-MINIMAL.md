# STORY-WS6-BE-ADMIN-WIKI-EDIT-MINIMAL – Минимален Admin Wiki edit endpoint с версииране

Status: Done

## Summary
Като **администратор на Wiki съдържанието**, искам **минимален Admin endpoint за редакция на Wiki статия**, който автоматично създава нова версия при всяка промяна, за да мога безопасно да коригирам статии и да запазвам история на измененията.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 (FR-WIKI) и §4.6 (FR-ADMIN-1..2 – Admin Wiki управление).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §5.1–5.2 (Admin Wiki съдържание и версии).
- System Architecture – `docs/architecture/system-architecture.md` (секции „Управление на версиите на Wiki съдържанието“ и Admin Portal).
- DB модел – `docs/architecture/db-model.md` (ентитети `WikiArticle` и `WikiArticleVersion`).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Wiki CRUD endpoints – да се синхронизират при нужда).
- WS-1/WS-4 – `docs/backlog/ws-1/*`, `docs/backlog/ws-4/epics/EPIC-WS4-ADMIN-WIKI.md` (public Wiki + Admin Wiki read-only).

## Acceptance Criteria
- Съществува защитен Admin endpoint за редакция на Wiki статия:
  - `PUT /api/admin/wiki/articles/{id}`;
  - guard-нат с JWT + проверка, че ролята е `admin` (в синхрон с вече съществуващите Admin guard-ове).
- Endpoint-ът приема JSON body с основни полета за статията (напр. `title`, `content`, `language`, `status`), в синхрон с Wiki модела и OpenAPI описанието.
- При успешна редакция:
  - основната статия (`WikiArticle`) се актуализира с новите стойности;
  - се създава нов запис в `WikiArticleVersion`, който съдържа поне: `articleId`, `language`, `title`, `content`, `version`, `createdAt` (и по възможност `createdBy`).
- Endpoint-ът връща `200 OK` и актуализирания `WikiArticle` (или подходящ summary payload), в синхрон с OpenAPI.
- При невалидни данни (липсващо заглавие, твърде кратко съдържание или други базови правила) endpoint-ът връща `400` с ясно съобщение за грешка.
- При липсваща статия с даден `id` endpoint-ът връща `404`.

## Dev Tasks
- [ ] Анализ на съществуващия Wiki/Admin код и DB модел за да се определи кои полета могат да се редактират безопасно в WS-6.
- [ ] Добавяне/разширяване на Admin Wiki service/контролер в основния API (`be/`), така че да поддържа `PUT /api/admin/wiki/articles/{id}`:
  - [ ] Guard-ване с вече наличния `JwtAuthGuard` + `AdminGuard` (или еквивалентна роля проверка).
  - [ ] Валидация на входните данни (DTO + class-validator правила).
  - [ ] Логика за обновяване на `WikiArticle` и създаване на нов `WikiArticleVersion` запис.
- [ ] Синхронизиране на `docs/architecture/openapi.yaml` така, че описанието на `PUT /admin/wiki/articles/{id}` да съвпада с реалната имплементация (request/response схеми и статуси).
- [ ] Unit тестове за service слоя (update + създаване на версия):
  - [ ] Позитивен сценарий – валидни данни, статията се обновява и се създава нова версия с коректни полета.
  - [ ] Негативен сценарий – невалидни данни → хвърля се очакваната грешка / връща се 400.
- [ ] E2E тестове (supertest) за `PUT /api/admin/wiki/articles/{id}`:
  - [ ] Успешна редакция с admin JWT → 200 + актуализирана статия.
  - [ ] Липсващ или не-admin JWT → 401/403.
  - [ ] Липсваща статия → 404.

## Notes
- Тази story се фокусира върху **редакция и версииране**, без да добавя нови endpoints за създаване или изтриване на статии – те могат да се покрият в бъдещи WS.
- Конкретните правила за валидация (минимална дължина на съдържанието, позволени статуси и др.) трябва да са в синхрон с вече дефинираните в Wiki модула, за да няма разминаване между Admin и публичния Wiki API.
