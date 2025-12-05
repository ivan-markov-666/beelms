# EPIC-WS8-ADMIN-USERS-METRICS – Admin Users, Metrics & Legal (MVP завършване)

Status: Planned

_Роля: PM / Architect / Tech Lead. Ниво: Walking Skeleton WS-8. Цел: да затвори оставащите MVP функционалности за Admin Users, Admin Metrics и Legal страници, стъпвайки върху вече дефинираните WS-5 stories._

## Summary

WS-8 реализира минимален, но реален **Admin vertical** за управление на потребители и базови метрики, плюс публичните **Legal/Privacy/Terms страници**, така че:

- да бъде завършен MVP обхватът на `EPIC-ADMIN-PORTAL` (управление на потребители + базови метрики);
- да бъде покрит минималният обхват на `EPIC-CROSS-METRICS` (брой регистрирани потребители);
- да бъде покрит визуалният/legal аспект на `EPIC-CROSS-GDPR-LEGAL` (Terms of Use и Privacy/GDPR страници).

WS-8 **не въвежда нови FR изисквания**, а реализира вече описани WS-5 stories, групирани и планирани като самостоятелен walking skeleton.

## Scope (какво покрива този epic)

### 1. Admin Users (управление на потребители)

- Backend:
  - `GET /api/admin/users` – списък с потребители с базово странициране и филтър по email (`page`, `pageSize`, `q`).
  - `PATCH /api/admin/users/{id}` – промяна на `active` флаг (activate/deactivate).
  - Guard-ване с JWT + role/permission check за admin.
- Frontend:
  - Страница `/admin/users` в Admin shell:
    - таблица с потребители (email, role, active, createdAt);
    - търсене по email (минимум substring search);
    - toggle за `active` с визуален feedback и обработка на грешки.

### 2. Admin Metrics (минимални метрики)

- Backend:
  - `GET /api/admin/metrics/overview` – минимален payload с поне едно поле:
    - `totalUsers` – общ брой регистрирани потребители.
    - `usersChangePercentSinceLastMonth` – процент промяна на общия брой
      потребители спрямо края на предходния календарен месец (по `createdAt`).
  - Endpoint-ът е guard-нат само за admin потребители.
- Frontend:
  - Страница `/admin` се държи като **Dashboard**, а не само като shell:
    - summary card „Общ брой потребители: X“, захранван от metrics endpoint-а;
    - динамичен лейбъл за процент промяна спрямо миналия месец, базиран на
      `usersChangePercentSinceLastMonth`.
    - бързи линкове към `/admin/wiki` и `/admin/users`.

### 3. Legal / GDPR страници

- FE статични страници:
  - `/legal/privacy` – Privacy/GDPR информация;
  - `/legal/terms` – Terms of Use.
- Видими линкове към тези страници:
  - най-малко във footer на публичните страници;
  - по избор – в header/user menu.

## Out of scope

Извън обхвата на този epic (и следователно на WS-8) остават:

- Пълен Admin Portal с детайлно управление на роли и permissions;
- Разширени метрики (retention, funnels, time-series графики и др.);
- Централизирана observability/monitoring платформа (Prometheus/Grafana и др.);
- Нови GDPR флоу-ове отвъд вече реализираните Auth/Profile stories.

## Child Stories

WS-8 използва следните вече дефинирани WS-5 stories като реални delivery units:

- **Admin Users (BE/FE)**
  - `STORY-WS5-BE-ADMIN-USERS-LIST` – Admin Users API (списък и активиране/деактивиране).
  - `STORY-WS5-FE-ADMIN-USERS-PAGE` – страница `/admin/users` с таблица и toggle за `active`.

- **Admin Metrics (BE/FE)**
  - `STORY-WS5-BE-ADMIN-METRICS-MINIMAL` – минимален Admin Metrics endpoint `GET /api/admin/metrics/overview` с `totalUsers`.
  - `STORY-WS5-FE-ADMIN-DASHBOARD` – `/admin` като Dashboard със summary card и линкове.
  - `STORY-WS8-BE-ADMIN-METRICS-MONTHLY-CHANGE` – разширение на `MetricsOverview`
    с `usersChangePercentSinceLastMonth` и реално изчисление в BE.
  - `STORY-WS8-FE-ADMIN-DASHBOARD-MONTHLY-CHANGE` – показване на динамичния
    процент в Admin Dashboard вместо статичен текст.

- **Legal страници (FE)**
  - `STORY-WS5-FE-LEGAL-PAGES` – статични `/legal/privacy` и `/legal/terms` + линкове във footer/header.

WS-8 не добавя нови story ID-та; при нужда нови refinement stories могат да бъдат добавени под `ws-8/stories/` в отделни файлове по същия шаблон.

## Related BMAD artifacts

- Product Brief – `docs/product/product-brief.md` (Admin & Metrics, Legal/GDPR секции за MVP).
- PRD – `docs/product/prd.md` (§4.6 FR-ADMIN-1..4, §4.7 FR-CROSS-2, FR-CROSS-3, FR-LEGAL-1).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§5.1–5.4 Admin Portal; §6.2 GDPR; §6.3 Метрики).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL, EPIC-CROSS-METRICS, EPIC-CROSS-GDPR-LEGAL).
- EPIC-WS5 Admin – `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`.

## Risks & Assumptions

- Приема се, че Auth/roles вече са стабилни (WS-2), така че admin guard-ването да стъпва на готов механизъм.
- Приема се, че DB моделът за `User` е финализиран и поддържа нужните полета (`role`, `active`, timestamps и т.н.).
- Риск: неподходящ UX за admin (твърде сложен или твърде опростен) – смекчава се с минимален, но ясен UI и евентуален UX review.
- Риск: метриките да се разширят неконтролирано отвъд MVP (scope creep) – смекчава се чрез ясно описан Out of scope раздел.

## Definition of Done (WS-8)

- BE endpoints за Admin Users и Admin Metrics са реализирани, guard-нати за admin и покрити с unit/e2e тестове.
- FE страници `/admin` и `/admin/users` са налични, достъпни само за admin и използват реалните BE endpoints.
- FE статични страници `/legal/privacy` и `/legal/terms` са налични и лесно достъпни чрез линкове във footer (и/или header).
- OpenAPI (`docs/architecture/openapi.yaml`) е актуализиран за Admin Users и Admin Metrics endpoints.
- MVP Feature List и MCP EPIC Map отразяват, че Admin Users, минималните метрики и Legal страниците са реализирани в WS-8.
- Има базов ръчен чеклист или e2e сценарии, които проверяват end-to-end потока: admin login → `/admin` → `/admin/users` → toggle на user → връщане към Dashboard с правилен `totalUsers` + проверка за наличност на Legal страниците.
