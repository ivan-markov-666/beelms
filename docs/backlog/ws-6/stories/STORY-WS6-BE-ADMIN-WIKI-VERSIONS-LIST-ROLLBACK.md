# STORY-WS6-BE-ADMIN-WIKI-VERSIONS-LIST-ROLLBACK – Списък с версии и rollback endpoint

Status: Planned

## Summary
Като **администратор на Wiki съдържанието**, искам **списък с версиите на статия и възможност да върна статията към избрана предишна версия**, за да мога да коригирам грешки или да възстановявам по-стари варианти на съдържанието.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.1 (FR-WIKI) и §4.6 (FR-ADMIN-2 – управление на версии и rollback).
- MVP feature list – `docs/architecture/mvp-feature-list.md` §5.2 (управление на Wiki версии).
- System Architecture – `docs/architecture/system-architecture.md` (секция „Управление на версиите на Wiki съдържанието“).
- DB модел – `docs/architecture/db-model.md` (ентитет `WikiArticleVersion`).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Wiki versions endpoints – да се синхронизират при нужда).
- EPIC-WS6 – `docs/backlog/ws-6/epics/EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS.md`.

## Acceptance Criteria
- Съществуват защитени Admin endpoint-и за работа с версии:
  - `GET /api/admin/wiki/articles/{id}/versions` – връща списък с версии за статия;
  - `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` – прави rollback към избрана версия.
- И двата endpoint-а са guard-на-ти с JWT + admin роля (същите guard-ове като останалите Admin Wiki endpoints).
- `GET /api/admin/wiki/articles/{id}/versions`:
  - връща `200 OK` с масив от версии, съдържащ поне: `id` (versionId), `version` (номер), `language`, `title`, `createdAt`, `createdBy` (ако е налично);
  - при липсваща статия връща `404`.
- `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore`:
  - при успех връща `200 OK` и обновената статия (или текущата активна версия), която отразява съдържанието на избраната версия;
  - създава нов запис в `WikiArticleVersion`, който репликира съдържанието на старата версия, но с нов `version` и `createdAt` (rollback се третира като нова версия);
  - при липсваща статия или версия връща `404`;
  - при невалидни параметри връща `400`.

## Dev Tasks
- [ ] Имплементация на service методи за:
  - [ ] извличане на всички версии за статия, сортирани по `createdAt`/`version` (низходящо);
  - [ ] намиране на конкретна версия по `versionId` и генериране на нова „текуща“ версия при rollback.
- [ ] Добавяне на контролер endpoints (или разширяване на съществуващия Admin Wiki контролер) за:
  - [ ] `GET /api/admin/wiki/articles/{id}/versions`;
  - [ ] `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore`;
  - [ ] guard-ване с `JwtAuthGuard` + `AdminGuard`.
- [ ] Синхронизация на OpenAPI (`docs/architecture/openapi.yaml`) за версиите:
  - [ ] Проверка/добавяне на описанията за versions endpoints (ако липсват или са непълни);
  - [ ] Уточняване на response shape за версията и rollback отговора.
- [ ] Unit тестове за service logic:
  - [ ] връщане на списък с версии за статия;
  - [ ] успешен rollback – създаване на нова версия на база старата и обновяване на статията;
  - [ ] поведение при липсваща статия/версия.
- [ ] E2E тестове (supertest) за:
  - [ ] `GET /api/admin/wiki/articles/{id}/versions` (admin, non-admin, липсваща статия);
  - [ ] `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` (успешен rollback, липсваща статия/версия, не-admin достъп).

## Notes
- Тази story предполага, че `STORY-WS6-BE-ADMIN-WIKI-EDIT-MINIMAL` вече е имплементирана или е поне частично налична (модели и базови Admin Wiki service методи).
- Поведението при rollback трябва да бъде внимателно обмислено от гледна точка на audit/история – в WS-6 третираме rollback като **нова версия**, а не като „изтриване“ на историята.
