# EPIC-WS5-ADMIN-USERS-METRICS – Admin Users & Metrics (минимален Admin Dashboard)

Status: Planned

## Summary
Този epic обхваща walking skeleton WS-5 за **Admin Portal – Users & Metrics**: минимален, но реален admin vertical, който позволява на администратор да:
- преглежда списък с потребители и да активира/деактивира акаунти;
- вижда базови метрики за платформата (брой регистрирани потребители);
- използва централен Admin Dashboard като entry point, стъпвайки върху вече наличния Admin shell и Auth роли.

## Scope (какво покрива този epic)
- **Admin Users (BE)**
  - `GET /api/admin/users` – списък с потребители с базова филтрация/странициране (`q` за търсене по имейл, `page`/`pageSize` за странициране), в синхрон с `docs/architecture/openapi.yaml`.
  - `PATCH /api/admin/users/{id}` – промяна на `active` флаг (activate/deactivate).
  - Guard-ване с JWT + role/permission check за admin.
- **Admin Users (FE)**
  - Страница `/admin/users` в Admin shell:
    - таблица с потребители (email, role, active, createdAt);
    - търсене по email (минимум substring search);
    - toggle за `active` с визуален feedback и обработка на грешки.
- **Admin Metrics Minimal (BE)**
  - `GET /api/admin/metrics/overview` – минимален payload, напр.:
    - `totalUsers`
    - (по желание) `activeUsers`.
    Тялото на отговора следва `MetricsOverview` schema в `docs/architecture/openapi.yaml`; за WS-5 е задължително коректното изчисляване поне на `totalUsers`, а останалите полета могат да бъдат 0/празни или да се развият допълнително в бъдещи WS.
- **Admin Dashboard (FE)**
  - Страница `/admin` да се държи като Dashboard:
    - card с „Общ брой регистрирани потребители“ (от metrics endpoint);
    - бързи линкове към `/admin/wiki` и `/admin/users`.
- **Интеграция със съществуващите компоненти**
  - Използване на съществуващия Auth/Users модел.
  - Използване на вече съществуващия Admin shell и навигация (WS‑4).

Out of scope за този epic:
- Пълен Admin Portal с детайлно управление на роли/permissions.
- Разширени метрики (retention, funnels, time-series dashboards).
- Централизирана observability/monitoring платформа (Prometheus/Grafana и др.).

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (Admin & metrics секции за MVP).
- PRD – `docs/product/prd.md` (§4.x FR-ADMIN-* за Admin Portal, §4.7 FR-CROSS-3 Metrics).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (Admin Portal, минимални метрики).
- System Architecture – `docs/architecture/system-architecture.md` (компоненти "Admin portal", "metrics_service").
- OpenAPI – `docs/architecture/openapi.yaml` (Admin Users, Admin Metrics ендпойнти – ако са описани, да се синхронизират).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-ADMIN-PORTAL, EPIC-CROSS-METRICS).

## Child user stories
- [ ] STORY-WS5-BE-ADMIN-USERS-LIST – Admin Users API: списък и активиране/деактивиране.
- [ ] STORY-WS5-FE-ADMIN-USERS-PAGE – FE страница `/admin/users` с таблица и toggle за active.
- [ ] STORY-WS5-BE-ADMIN-METRICS-MINIMAL – Минимален Admin Metrics endpoint.
- [ ] STORY-WS5-FE-ADMIN-DASHBOARD – FE Admin Dashboard със summary card за метрики.
- [ ] STORY-WS5-FE-LEGAL-PAGES (optional в WS-5 или следващ WS) – Статични Privacy/Terms страници + линкове.

## Risks / Assumptions
- **Risks:**
  - Неправилно guard-ване на Admin ендпойнти може да изложи чувствителна информация.
  - Некоректна промяна на `active` флаг може да блокира легитимни потребители.
  - Метриките могат да станат бавни при по-голям обем данни, ако не се мисли за индекси/агрегати.
- **Assumptions:**
  - Съществува ролев модел, който позволява разграничаване на admin от обикновени потребители.
  - Администраторите са вътрешни оператори (по-малка нужда от сложни approvals/workflows).
  - За WS-5 са достатъчни прости агрегати (брой потребители) без исторически time-series.

## Definition of Done (Epic)
- Всички child stories по-горе са изпълнени и затворени.
- Съществува напълно функционална страница `/admin` с видима card за броя потребители и линкове към основните admin секции.
- Администратор може да:
  - отвори `/admin/users`;
  - види списък с потребители и да филтрира по email;
  - активира/деактивира потребители през UI, като това се отразява на BE.
- Admin Metrics endpoint връща коректни стойности и е guard-нат само за admin.
- Има поне базови BE/FE тестове за основните сценарии (list/toggle/metrics/dashboard).
- Няма отворени P0/P1 дефекти за Admin Users & Metrics вертикала.
