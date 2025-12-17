# MVP DoD чеклист (BMAD)

Този документ описва минимален Definition of Done (DoD) за MVP версията на продукта, базиран на BMAD (Business, Metrics, Architecture, Docs). Използва се като финален gate преди да кажем, че „MVP е реално готов“.

## 1. Business & Product (B)
 
 - **Ясен MVP обхват**
   - [ ] MVP функционалностите в `docs/architecture/mvp-feature-list.md` са или имплементирани, или съзнателно маркирани като "out of scope" с причина.
   - [ ] Всички MVP епики в `docs/backlog/beelms-core-epics-and-stories.md` имат поне един walking skeleton (WS‑1..WS‑4), който реално работи.
 
 - **Критични потребителски пътеки (end‑to‑end)**
   - [ ] Анонимен потребител може да отвори публичния Wiki / home страницата и Legal страниците (Terms/Privacy).
   - [ ] Потребител може да се регистрира / логне и да достъпи Courses/My Courses и базов quiz flow според MVP.
  - [ ] Admin може да влезе в `/admin`, да види списъка с потребители `/admin/users` и да активира/деактивира потребители.
  - [ ] Admin може да види базови метрики в `/admin` (например total users).
  - [ ] Горните пътеки са минати ръчно поне веднъж на "чиста" среда (fresh DB или през миграции).

- **Product expectations**
  - [ ] Това, което показват UI + API, отговаря на описаното в PRD / backlog.
  - [ ] Известните компромиси са описани (Known Limitations / Non‑Goals секция).

## 2. Metrics & Observability (M)

- **Минимални продуктови метрики**
  - [ ] Админ метриките, планирани за MVP, са имплементирани (напр. `GET /api/admin/metrics/overview` с `totalUsers`).
  - [ ] Потвърдено е, че метриките се изчисляват коректно спрямо реалните данни в DB.

- **Логване и мониторинг (минимум за MVP)**
  - [ ] Backend логва ключови грешки (логин, регистрация, критични admin операции) и 4xx/5xx по основните пътеки.
  - [ ] Има базов начин да се видят логовете в dev/staging (конзола, файл или log aggregator).

- **Технически health**
  - [ ] Има поне един health check (или лесен начин) да се провери, че API-то е живо и DB връзката работи.

## 3. Architecture, Implementation & Quality (A)

- **API контракт & security**
  - [ ] Основните API endpoints (особено за WS‑1..WS‑4) са описани в `docs/architecture/openapi.yaml`, реално съществуват в NestJS и са защитени правилно (JWT, admin guard където е нужно).
  - [ ] Frontend използва само описани в OpenAPI endpoints (няма "скрити" магически URL‑и).

- **Качество на имплементацията**
  - [ ] Няма очевидни N+1 или груби performance проблеми за текущия мащаб.
  - [ ] Основните домейн услуги (напр. `AdminUsersService`, auth services, demo services) имат ясни входове/изходи, добре дефинирани DTO‑та и валидации.
  - [ ] Грешките се хващат и връщат като смислени HTTP отговори (4xx/5xx), а не като "white screen".

- **Security минимум за MVP**
  - [ ] Паролите се пазят хеширани.
  - [ ] JWT секретите и чувствителните данни са в env променливи (примерен `.env.example`).
  - [ ] Admin функционалностите са ограничени до `admin` роля.
  - [ ] CORS и базови security headers са настроени за FE/BE.

- **Тестове**
  - [ ] Има unit tests за ключови backend услуги (вкл. `AdminUsersService`, auth и основните domain services).
  - [ ] Има e2e tests за критичните API пътеки (логин, основни WS endpoints, admin endpoints).
  - [ ] Има frontend tests за основните страници/компоненти (напр. `/admin`, `/admin/users`, legal pages, ключови Courses/Assessments flows).
  - [ ] CI pipeline минава зелено (lint + tests) преди merge към основния клон.

## 4. Docs, Backlog & Change Management (D)

- **Backlog & BMAD артефакти**
  - [ ] `docs/backlog/beelms-core-epics-and-stories.md` и `docs/architecture/mvp-feature-list.md` отразяват реално състоянието на имплементацията (MVP частта не противоречи на кода).
  - [ ] WS‑epic‑ите имат актуален статус (Planned → Implemented/Done).
  - [ ] WS‑stories (WS‑1..WS‑4) имат маркиран статус (Planned / Implemented / Tested / Done) и бележки за известни отклонения от първоначалния план (ако има такива).

- **README & developer docs**
  - [ ] Root `README` описва какво е MVP на продукта и как да се стартират BE/FE (dev + basic prod/staging).
  - [ ] BE/FE имат кратки README / секции за env променливи, команди за `npm run test`, `npm run e2e`, `lint`, build, и как да се инициализира DB за MVP сценарии.
  - [ ] Има секция "Known Issues / Tech Debt", която описва какво остава за post‑MVP.

- **Release & deploy**
  - [ ] Има описан минимален процес как се прави build, как се деплойва (дори да е само manual deploy) и какво се тества след deploy.
  - [ ] Има поне един пробен deploy на среда, която е максимално близка до бъдещ production.
