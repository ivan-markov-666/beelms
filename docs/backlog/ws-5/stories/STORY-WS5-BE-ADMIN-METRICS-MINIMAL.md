# STORY-WS5-BE-ADMIN-METRICS-MINIMAL – Минимален Admin Metrics endpoint

Status: Planned

## Summary
Като **администратор** искам **API за базови метрики (брой потребители)**, за да имам видимост върху размера на потребителската база директно през Admin Dashboard.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (§4.7 FR-CROSS-3 – Metrics).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin metrics – брой регистрирани потребители).
- System Architecture – `docs/architecture/system-architecture.md` (metrics_service, Admin портал).
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Metrics endpoint – при нужда да се допълни).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-CROSS-METRICS, EPIC-ADMIN-PORTAL).

## Acceptance Criteria
- Има ендпойнт `GET /api/admin/metrics/overview` (име може да бъде уточнено в OpenAPI), който:
  - е guard-нат само за admin потребители;
  - връща JSON payload с поне едно поле:
    - `totalUsers` – общ брой регистрирани потребители.
  - Payload-ът следва `MetricsOverview` schema в `docs/architecture/openapi.yaml`; за WS-5 е задължително коректното изчисляване поне на `totalUsers`, останалите полета могат да останат 0/празни или да бъдат доразвити в бъдещи WS.
- Изчисляването на метриките е достатъчно ефективно за текущия обем данни (директно `COUNT(*)` е приемливо за WS-5).
- При грешка (например проблем с базата) се връща подходяща HTTP грешка, без чувствителни данни.

## Dev Tasks
- [ ] Дизайн и имплементация на `GET /api/admin/metrics/overview` в Admin/metrics контролер/услуга.
- [ ] Достъп до User repository/service за изчисляване на `totalUsers` (и `activeUsers`, ако се включи).
- [ ] Guard-ване на ендпойнта с Admin guard.
- [ ] Обновяване на `docs/architecture/openapi.yaml` с реалната спецификация.
- [ ] Unit тестове за metrics service (правилно изчисление).
- [ ] Integration/e2e тестове за metrics endpoint (auth + сценарий).
