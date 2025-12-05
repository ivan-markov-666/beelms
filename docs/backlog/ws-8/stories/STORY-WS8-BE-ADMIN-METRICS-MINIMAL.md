# STORY-WS8-BE-ADMIN-METRICS-MINIMAL – Минимален Admin Metrics endpoint (WS-8 реализация)

Status: Planned

_Забележка: Това WS-8 BE story реализира на практика обхвата на `STORY-WS5-BE-ADMIN-METRICS-MINIMAL` в рамките на WS-8._

## Summary

Като **администратор** искам **API за базови метрики (най-малко `totalUsers`)**, за да имам видимост върху размера на потребителската база чрез Admin Dashboard.

WS-8 осигурява реален, guard-нат `GET /api/admin/metrics/overview` endpoint, който ще се използва от FE `/admin` страницата.

## Links to BMAD artifacts

- PRD – `docs/product/prd.md` (§4.7 FR-CROSS-3 – Metrics, FR-ADMIN-4).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.4 Админ метрики, §6.3 Метрики).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-CROSS-METRICS, EPIC-ADMIN-PORTAL).
- Conceptual Epic – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`.
- WS-5 canonical story – `docs/backlog/ws-5/stories/STORY-WS5-BE-ADMIN-METRICS-MINIMAL.md`.
- WS-8 Epic – `docs/backlog/ws-8/epics/EPIC-WS8-ADMIN-USERS-METRICS.md`.

## Acceptance Criteria (WS-8 перспектива)

- WS-8 story-то се счита успешно, когато всички Acceptance Criteria от `STORY-WS5-BE-ADMIN-METRICS-MINIMAL` са изпълнени.
- Endpoint-ът е guard-нат само за admin и връща коректно изчислен `totalUsers` (и евентуално други полета от `MetricsOverview`).

## Dev Tasks (WS-8)

- [ ] Имплементиране на `GET /api/admin/metrics/overview` в Admin/metrics слоя.
- [ ] Осигуряване на коректно броене на потребители (и евентуално `activeUsers`).
- [ ] Unit/интеграционни тестове за endpoint-а.
- [ ] Синхронизация на OpenAPI (`docs/architecture/openapi.yaml`).

## Notes

- Parent Epic: `EPIC-WS8-ADMIN-USERS-METRICS`.
- FE консумация: `STORY-WS8-FE-ADMIN-DASHBOARD`.
