# WS5 Admin – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-5 Admin Users & Metrics vertical + свързаните Legal страници._

## 1. Обхват

Тази последователност покрива:
- WS-5 Admin Users & Metrics BE/FE stories (walking skeleton WS-5 от `docs/delivery/walking-skeleton.md`, когато бъде допълнен).
- Свързана Legal story, планирана за изпълнение в същия timeframe (Privacy/Terms страници).

## 2. Препоръчителен ред за имплементация

### WS-5 – Admin Users & Metrics walking skeleton (BE → FE)

1. **STORY-WS5-BE-ADMIN-USERS-LIST**  
   Admin Users API (`GET /api/admin/users`, `PATCH /api/admin/users/{id}`) с guard-ване за admin, странициране и филтър по email.

2. **STORY-WS5-FE-ADMIN-USERS-PAGE**  
   FE страница `/admin/users`, която стъпва върху API-то от story 1 и показва таблица с потребители, филтър по email и toggle за `active`.

3. **STORY-WS5-BE-ADMIN-METRICS-MINIMAL**  
   Минимален Admin Metrics endpoint (`GET /api/admin/metrics/overview`) за `totalUsers` (и евентуално `activeUsers`), guard-нат само за admin.

4. **STORY-WS5-FE-ADMIN-DASHBOARD**  
   FE Admin Dashboard на `/admin`, който консумира metrics endpoint от story 3 и показва summary card с брой потребители + линкове към `/admin/wiki` и `/admin/users`.

### Свързани cross-cutting разширения (в същия timeframe)

5. **STORY-WS5-FE-LEGAL-PAGES**  
   Статични страници `/legal/privacy` и `/legal/terms` + линкове във footer/header, които затварят Legal/GDPR UI аспектите от MVP.

---

## 3. Бележки

- Stories 1–4 реализират основния WS‑5 **Admin Users & Metrics** vertical – от API до реален Admin Dashboard.
- Story 5 не е част от чистия Admin skeleton, но е логичен кандидат в същия timeframe, тъй като завършва видимата Legal/GDPR част на MVP.
- Детайлният scope и acceptance criteria за всяка story са описани в:
  - `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`;
  - `docs/backlog/ws-5/stories/STORY-WS5-*.md`.
