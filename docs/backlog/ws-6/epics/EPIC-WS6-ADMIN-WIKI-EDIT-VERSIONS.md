# EPIC-WS6-ADMIN-WIKI-EDIT-VERSIONS – Admin Wiki редакция и версии

Status: Done

## Summary
Този epic дефинира WS-6 walking skeleton за **Admin управление на Wiki съдържание**: минимален, но реален vertical, в който администратор може да редактира Wiki статии и да управлява версиите им (преглед на история и rollback към предишна версия), стъпвайки върху вече наличните WS-1 Wiki, WS-2 Auth/Profile и WS-4 Admin Wiki read-only vertical-и.

## Scope (какво покрива този epic)
- **Admin Wiki Edit (BE)**
  - Разширяване на Admin Wiki API така, че администратор да може да редактира съществуваща статия:
    - `PUT /api/admin/wiki/articles/{id}` – обновяване на заглавие/съдържание/език/статус.
  - Всяка успешна редакция създава нова версия в `WikiArticleVersion` таблицата, в синхрон с db модела и системната архитектура.
- **Admin Wiki Versions (BE)**
  - Ендпойнти за преглед и връщане към стари версии:
    - `GET /api/admin/wiki/articles/{id}/versions` – списък с версии за статия.
    - `POST /api/admin/wiki/articles/{id}/versions/{versionId}/restore` – rollback към избрана версия (създава нова „активна“ версия на статията).
- **Admin Wiki Edit (FE)**
  - FE екран за редакция на статия в Admin зоната (напр. `/admin/wiki/[id]`):
    - форма с основни полета (заглавие, език, съдържание, статус);
    - действия „Запиши промени“ и навигация обратно към списъка.
- **Admin Wiki Versions UI (FE)**
  - UI за преглед на историята на версиите и rollback:
    - списък с версии (language, title, дата, автор – когато са налични);
    - action за връщане към избрана версия, който вика BE rollback ендпойнта и обновява текущата статия.

Out of scope за този epic (за бъдещи WS/epics):
- Пълноценен WYSIWYG/markdown редактор с live preview.
- Управление на media (изображения) през Admin UI.
- Дискусии/коментари по версиите и сложни workflow-и за одобрение.

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (секция за Wiki и Admin/back office).
- PRD – `docs/product/prd.md` (§4.1 FR-WIKI, §4.6 FR-ADMIN-1..2 – Admin управление на Wiki съдържание и версии).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.1–5.2 – Admin Wiki съдържание и версии).
- System Architecture – `docs/architecture/system-architecture.md` (секции за Wiki версии, Admin Portal, роли и права).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Wiki CRUD + versions endpoints – да се синхронизират при нужда).
- DB модел – `docs/architecture/db-model.md` (ентитети `WikiArticle` и `WikiArticleVersion`).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL, EPIC-WIKI-ADMIN).
- WS-4 epic – `docs/backlog/ws-4/epics/EPIC-WS4-ADMIN-WIKI.md` (Admin Wiki read-only skeleton).

## Child user stories
- [x] STORY-WS6-BE-ADMIN-WIKI-EDIT-MINIMAL – Минимален Admin Wiki edit endpoint с версииране.
- [x] STORY-WS6-BE-ADMIN-WIKI-VERSIONS-LIST-ROLLBACK – Списък с версии и rollback ендпойнт.
- [x] STORY-WS6-FE-ADMIN-WIKI-EDIT-PAGE – FE екран за редакция на статия в Admin зоната.
- [x] STORY-WS6-FE-ADMIN-WIKI-VERSIONS-UI – FE UI за история на версиите и rollback действие.

## Risks / Assumptions
- **Risks:**
  - Неправилно имплементиран rollback може да доведе до загуба на съдържание или неконсистентни версии.
  - Сложни UI/UX за версииране могат да претоварят WS-6 skeleton-а и да забавят delivery.
- **Assumptions:**
  - WS-1 Wiki и WS-4 Admin Wiki read-only вече са стабилни и базовият модел/endpoint-и работят.
  - Администраторските роли и guard-ове (JWT + role=admin) вече са налични от WS-4/WS-5.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Admin потребител може да:
  - отвори Admin Wiki списъка (`/admin/wiki`);
  - избере статия и да я редактира през dedicated Admin екран;
  - запази промяна, която създава нова версия в историята;
  - отвори историята на версиите за статия и да върне съдържанието към предишна версия.
- Non-admin потребители не могат да достъпват Admin Wiki edit/versions ендпойнтите и UI.
- Основните сценарии (edit, versions list, rollback) са покрити с поне базови BE и FE тестове.
- Няма отворени P0/P1 дефекти за WS-6 Admin Wiki Edit & Versions вертикала.
