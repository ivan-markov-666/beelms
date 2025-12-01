# STORY-WS5-FE-ADMIN-DASHBOARD – Admin Dashboard със summary card за метрики

Status: Planned

## Summary
Като **администратор** искам **централен Admin Dashboard**, който показва ключови метрики (брой потребители) и линкове към основните admin секции, за да мога бързо да се ориентирам за състоянието на платформата.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` (Admin Portal overview / metrics).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin dashboard & metrics).
- System Architecture – `docs/architecture/system-architecture.md` (Admin FE, metrics визуализация).
- OpenAPI – `docs/architecture/openapi.yaml` (`GET /api/admin/metrics/overview`).
- Walking skeleton – `docs/delivery/walking-skeleton.md` (WS-5 Admin vertical – когато бъде допълнен).

## Acceptance Criteria
- Страницата `/admin` се държи като Dashboard (не само shell):
  - показва поне една **summary card**: „Общ брой потребители: X“;
  - card-ът използва данни от `GET /api/admin/metrics/overview`.
- На Dashboard има бързи линкове (cards/tiles/links) към:
  - `/admin/wiki`;
  - `/admin/users`.
- Покрити са basic състояния:
  - Loading – докато се зареждат метриките.
  - Error – ако metrics endpoint върне грешка (например съобщение „Неуспешно зареждане на метрики“).
- UI е в синхрон с останалия Admin shell и поддържа i18n (основни етикети в en/bg).

## Dev Tasks
- [ ] Адаптация на `/admin` route да бъде Dashboard страница (ако в момента е само shell).
- [ ] Имплементация на fetch към Admin Metrics endpoint и визуализация на `totalUsers`.
- [ ] Добавяне на навигационни tiles/links към `/admin/wiki` и `/admin/users`.
- [ ] Добавяне на loading/error UI за метриките.
- [ ] FE тестове (React Testing Library или екв.) за:
  - рендер на Dashboard с mocked metrics;
  - поведение при грешка на metrics API;
  - линкове към wiki/users.
