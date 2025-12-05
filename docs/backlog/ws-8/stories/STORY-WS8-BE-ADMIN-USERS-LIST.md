# STORY-WS8-BE-ADMIN-USERS-LIST – Admin Users API (WS-8 реализация)

Status: Planned

_Забележка: Това WS-8 BE story реализира на практика обхвата на `STORY-WS5-BE-ADMIN-USERS-LIST` в рамките на walking skeleton WS-8. Canonical acceptance criteria остават описани в WS-5 story файла; тук не ги дублираме, а ги реферираме._

## Summary

Като **администратор** искам да имам **API за списък с потребители и промяна на статуса им (active/inactive)**, така че да управлявам достъпа до платформата и да имам видимост върху потребителската база.

WS-8 фокусът е да реализира това поведение като част от Admin vertical-а за MVP (заедно с Admin Metrics и Legal), стъпвайки върху вече уточнения обхват в WS-5.

## Links to BMAD artifacts

- PRD – `docs/product/prd.md` (FR-ADMIN-* за управление на потребители).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.3 Управление на потребители).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL).
- Conceptual Epic – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`.
- WS-5 canonical story – `docs/backlog/ws-5/stories/STORY-WS5-BE-ADMIN-USERS-LIST.md`.
- WS-8 Epic – `docs/backlog/ws-8/epics/EPIC-WS8-ADMIN-USERS-METRICS.md`.

## Acceptance Criteria (WS-8 перспектива)

- Това WS-8 story се счита успешно завършено, когато **всички Acceptance Criteria от** `STORY-WS5-BE-ADMIN-USERS-LIST` са изпълнени и покрити с подходящи тестове.
- Няма допълнителни FR изисквания, извън вече описаното в WS-5; WS-8 може да добавя само технически/имплементационни уточнения (напр. тестови покрития, logging), без да разширява бизнес обхвата.

## Dev Tasks (WS-8)

- [ ] Имплементиране/довършване на `GET /api/admin/users` и `PATCH /api/admin/users/{id}` според спецификацията в WS-5 story-то и OpenAPI.
- [ ] Guard-ване на ендпойнтите само за admin (използвайки вече наличния Auth/roles механизъм от WS-2).
- [ ] Unit/интеграционни тестове за основните сценарии: list, filter, paginate, toggle active, 401/403.
- [ ] Синхронизация на `docs/architecture/openapi.yaml` за Admin Users endpoints (ако има разминавания).
- [ ] Ръчен чеклист или e2e сценарий в комбинация с FE `/admin/users` страницата.

## Notes

- Parent Epic: `EPIC-WS8-ADMIN-USERS-METRICS`.
- Conceptual Epic: `EPIC-WS5-ADMIN-USERS-METRICS`.
- Canonical бизнес/acceptance детайлите остават в WS-5 story файла; WS-8 е delivery-фокусиран wrapper за конкретния walking skeleton.
