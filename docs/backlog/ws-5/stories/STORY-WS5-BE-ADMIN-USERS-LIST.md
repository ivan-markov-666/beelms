# STORY-WS5-BE-ADMIN-USERS-LIST – Admin Users API (списък и активиране/деактивиране)

Status: Planned

## Summary
Като **администратор** искам да имам **API за списък с потребители и промяна на статуса им (active/inactive)**, за да мога да управлявам достъпа до платформата и да следя потребителската база.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (FR-ADMIN-* за управление на потребители).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin Portal – управление на потребители).
- System Architecture – `docs/architecture/system-architecture.md` (Admin portal, Auth/Users service).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Users ендпойнти – list/update).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL).

## Acceptance Criteria
- `GET /api/admin/users`:
  - Достъпен е само за потребители с admin роля/permission.
  - Поддържа базово странициране чрез query параметри `page` и `pageSize` (аналогично на `/wiki/articles`) и опционален филтър по email чрез query параметър `q` (substring match), в синхрон с `openapi.yaml`.
  - Връща списък с потребители с полета (пример): `id`, `email`, `role`, `active`, `createdAt`, без чувствителни данни (пароли, хешове и др.).
- `PATCH /api/admin/users/{id}`:
  - Достъпен е само за admin.
  - Позволява промяна на `active` флаг (activate/deactivate).
  - При опит за промяна на несъществуващ потребител връща 404.
  - При успешна промяна връща актуализирания потребител (или success отговор без чувствителни данни).
- Validation & Security:
  - Input-ът се валидира (валиден `id`, позволени само whitelisted полета).
  - Няма изтичане на чувствителни данни в отговори/логове.
  - Ендпойнтите са описани и синхронизирани с `openapi.yaml`.

## Dev Tasks
- [ ] Допълване/разширяване на Admin guard (role/permission check) за Admin Users ендпойнтите.
- [ ] Имплементация на `GET /api/admin/users` с репозитори заявка към потребителите + филтър по email и странициране.
- [ ] Имплементация на `PATCH /api/admin/users/{id}` с промяна на `active` флаг и подходящи валидации.
- [ ] Актуализиране на `docs/architecture/openapi.yaml` (ако е нужно) според реалната имплементация.
- [ ] Unit тестове за service слоя (fetch list, filter, toggle active).
- [ ] Integration/e2e тестове за Admin Users ендпойнтите (автентикация + основни сценарии).
