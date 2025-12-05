# WS8 Admin – Implementation Order of User Stories

_Роля: Tech Lead / Analyst. Цел: ясен ред за имплементация на WS-8 Admin Users, Metrics & Legal walking skeleton, стъпвайки върху вече дефинираните WS-5 stories._

## 1. Обхват

Тази последователност покрива:

- WS-8 Admin Users & Metrics vertical (използва WS-5 BE/FE stories за Admin Users и Admin Metrics);
- Legal/Privacy/Terms страници като видима част от `EPIC-CROSS-GDPR-LEGAL`.

WS-8 **не променя** функционалните изисквания от WS-5 stories, а само дефинира техния delivery ред в отделен walking skeleton.

## 2. Препоръчителен ред за имплементация

### WS-8 – Admin Users & Metrics walking skeleton (BE → FE)

1. **STORY-WS5-BE-ADMIN-USERS-LIST**  
   Admin Users API (`GET /api/admin/users`, `PATCH /api/admin/users/{id}`) с guard-ване за admin, странициране и филтър по email.

2. **STORY-WS5-FE-ADMIN-USERS-PAGE**  
   FE страница `/admin/users`, която стъпва върху API-то от story 1 и показва таблица с потребители, филтър по email и toggle за `active`.

3. **STORY-WS5-BE-ADMIN-METRICS-MINIMAL**  
   Минимален Admin Metrics endpoint (`GET /api/admin/metrics/overview`) за `totalUsers` (и евентуално `activeUsers`), guard-нат само за admin.

4. **STORY-WS5-FE-ADMIN-DASHBOARD**  
   FE Admin Dashboard на `/admin`, който консумира metrics endpoint от story 3 и показва summary card с брой потребители + линкове към `/admin/wiki` и `/admin/users`.

### Свързани Legal/GDPR разширения (в същия timeframe)

5. **STORY-WS5-FE-LEGAL-PAGES**  
   Статични страници `/legal/privacy` и `/legal/terms` + линкове във footer/header, които затварят Legal/GDPR UI аспектите от MVP.

## 3. Бележки

- Stories 1–4 реализират основния WS‑8 **Admin Users & Metrics** vertical – от Admin API през FE Admin Dashboard.
- Story 5 не е част от чистия Admin skeleton, но е логичен кандидат в същия timeframe, тъй като завършва видимата Legal/GDPR част на MVP.
- Детайлният scope и acceptance criteria за всяка story са описани в:
  - `docs/backlog/ws-5/epics/EPIC-WS5-ADMIN-USERS-METRICS.md`;
  - `docs/backlog/ws-5/stories/STORY-WS5-*.md`.
- WS-8 се фокусира върху затваряне на оставащия MVP обхват за Admin Portal, Metrics и Legal, след стабилизирането на WS-1..WS-7 vertical-ите.
