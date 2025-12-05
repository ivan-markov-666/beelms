# STORY-WS8-FE-ADMIN-DASHBOARD – Admin Dashboard със summary card (WS-8 реализация)

Status: Planned

_Забележка: Това WS-8 FE story реализира на практика обхвата на `STORY-WS5-FE-ADMIN-DASHBOARD` в рамките на WS-8._

## Summary

Като **администратор** искам **централен Admin Dashboard на `/admin`**, който показва ключови метрики (най-малко брой потребители) и линкове към основните admin секции, за да се ориентирам бързо за състоянието на платформата.

WS-8 използва Admin Metrics endpoint-а от BE, за да визуализира `totalUsers` card.

## Links to BMAD artifacts

- PRD – `docs/product/prd.md` (Admin Portal overview / metrics).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.4 Admin dashboard & metrics).
- Conceptual Epic – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`.
- WS-5 canonical story – `docs/backlog/ws-5/stories/STORY-WS5-FE-ADMIN-DASHBOARD.md`.
- WS-8 Epic – `docs/backlog/ws-8/epics/EPIC-WS8-ADMIN-USERS-METRICS.md`.

## Acceptance Criteria (WS-8 перспектива)

- WS-8 story-то се счита успешно, когато `/admin` покрива acceptance criteria от `STORY-WS5-FE-ADMIN-DASHBOARD` и коректно визуализира данните от `GET /api/admin/metrics/overview`.

## Dev Tasks (WS-8)

- [ ] Имплементиране/адаптиране на страница `/admin` така, че да се държи като Dashboard (не само shell).
- [ ] Добавяне на summary card „Общ брой потребители: X“, консумиращ Admin Metrics endpoint.
- [ ] Добавяне на бързи линкове/tiles към `/admin/wiki` и `/admin/users`.
- [ ] FE тестове за визуализацията на метриките и линковете.

## Notes

- Parent Epic: `EPIC-WS8-ADMIN-USERS-METRICS`.
- Зависи от `STORY-WS8-BE-ADMIN-METRICS-MINIMAL` за данните.
