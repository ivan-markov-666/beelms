# STORY-CORE-METRICS-AGG-USERS – Aggregated registered users metric in Admin dashboard

## Summary
Като **админ**, искам да виждам **агрегирана метрика „брой регистрирани потребители“** в Admin Metrics/Dashboard, за да имам бърз, висок-ниво сигнал за растежа на системата.

## Links to BMAD artifacts
- Backlog index – `docs/backlog/beelms-core-epics-and-stories.md` §4.10 (EPIC-CORE-CROSS-METRICS)

## Acceptance Criteria
- Admin endpoint `GET /api/admin/metrics/overview` съдържа поле `totalUsers` (брой регистрирани потребители, включително active + deactivated/soft-deleted) и то е число `>= 0`.
- Endpoint-ът е защитен: 
  - 401 без токен
  - 403 за non-admin
- Admin UI показва `totalUsers` в Metrics/Dashboard view.
- Има e2e тест, който валидира, че `totalUsers` е number и е `>= 1` след като се регистрира поне един потребител.

## Dev Tasks
- [ ] BE: потвърждение/корекция на имплементацията в `AdminMetricsService.getOverview()` (да брои всички регистрирани потребители).
- [ ] FE: показване на `totalUsers` (ако вече е налично, само smoke/визуална проверка).
- [ ] Tests: e2e за admin metrics overview (ако вече съществува, да се уверим, че покрива AC).

## Test Plan (local)
- 1) DB + migrations + seed:
  - `docker compose up -d db`
  - `cd be`
  - `npm run test:setup-db`
- 2) e2e:
  - `cd be`
  - `npm run test:e2e`
- 3) UI smoke:
  - `cd fe`
  - `npm run dev`
  - Login като admin и проверка на Metrics/Dashboard.

## Notes
- В момента в кода вече съществува `AdminMetricsService` и `GET /api/admin/metrics/overview`, които изглежда включват `totalUsers`. Това Story цели да го formalize-не като core метрика с ясни AC и тестове.
