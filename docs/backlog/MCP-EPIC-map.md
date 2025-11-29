# QA4Free – MCP EPIC Map

_Роля: Analyst / PM / Architect. Ниво: MCP (целият продукт). Цел: връзка между Product Brief, PRD, MVP feature list и реалния EPIC backlog._

## 1. Контекст

- Източници:
  - Product Brief – `docs/product/product-brief.md` (§5.1–5.2)
  - PRD – `docs/product/prd.md` (§4.1–4.7)
  - MVP Feature List – `docs/architecture/mvp-feature-list.md`
- Този документ описва **EPIC-и за целия MCP** и маркира кои са **част от MVP** и кои са **post-MVP разширения**.
- Детайлите на ниво user stories се описват в отделни EPIC/STORY файлове под `docs/backlog/` (напр. `ws-1/epics`, `ws-1/stories`).

---

## 2. MVP EPIC-и

| EPIC ID | Име | Област | MVP? | PRD референции | MVP Feature List | Бележки |
| --- | --- | --- | --- | --- | --- | --- |
| **EPIC-WIKI-PUBLIC** | Публична Wiki навигация (списък + статия) | Wiki / Content | **Да (MVP)** | PRD §4.1 FR-WIKI-1..5, API `GET /api/wiki/articles`, `GET /api/wiki/articles/{slug}` | MVP §1.1–1.2 | Покрива публичните Wiki екрани и навигация за гости и регистрирани потребители. WS-1 реализацията е в `EPIC-WS1-WIKI-BE/FE` + свързаните WS-1 stories. |
| **EPIC-AUTH-ACCOUNTS** | Регистрация, вход, профил, забравена парола, изтриване и експорт на акаунт | Auth / Accounts | **Да (MVP)** | PRD §4.2 FR-AUTH-1..7 | MVP §2.1–2.4 | Включва всички основни AUTH flows (register/login/forgot/reset/password, профил, GDPR delete, export). |
| **EPIC-PRACTICE-UI-DEMO** | Практическа UI среда – страници с елементи за упражнения | Practical Env – UI | **Да (MVP)** | PRD §4.3 FR-UI-DEMO-1..3 | MVP §3.1 | Един или повече UI екрани с богати HTML компоненти + reset и примерни задачи за manual/UI automation. |
| **EPIC-PRACTICE-API-DEMO** | Практическа API среда – Training API + Swagger UI | Practical Env – API | **Да (MVP, минимален)** | PRD §4.4 FR-API-DEMO-1..3, API `GET /api/training/ping`, `POST /api/training/echo` | MVP §4.1–4.2 (минимален Training API) | Минимален Training API (ping/echo) с публичен Swagger UI за базови API/integration упражнения. Пълният CRUD демо ресурс е за post-MVP. |
| **EPIC-PRACTICE-TASKS** | Дефиниране, подаване и оценяване на практичeски задачи | Practical Env – Tasks | **Частично / поетапно** | PRD §4.5 FR-TASKS-1..3, API `/api/tasks/{id}`, `/api/tasks/{id}/submit` | Няма отделен MVP раздел; свързан е концептуално с практическата среда | Основен епик за задачи и автоматично оценяване. Може да бъде реализиран частично в MVP (напр. само basic tasks) и да се разшири post-MVP. |
| **EPIC-ADMIN-PORTAL** | Администраторски панел (Wiki, потребители, базови метрики) | Admin | **Да (MVP)** | PRD §4.6 FR-ADMIN-1..4, API `/api/admin/...` | MVP §5.1–5.4 | Управление на Wiki съдържание/версии, потребители и базово админ табло с метрики (най-малко брой регистрирани потребители). |
| **EPIC-CROSS-I18N** | Мултиезичност в интерфейса и съдържанието | Cross-cutting | **Да (MVP)** | PRD §4.7 FR-CROSS-1 | MVP §6.1; Product Brief §5.2 (2.11) | Поддръжка на поне два езика (BG/EN) за UI и Wiki съдържание. Влияе на Wiki, UI Demo, Auth, Admin. |
| **EPIC-CROSS-GDPR-LEGAL** | GDPR, права на потребителя, legal страници | Cross-cutting | **Да (MVP)** | PRD §4.7 FR-CROSS-2, FR-LEGAL-1; NFR §5.3, §5.2 | MVP §6.2; Product Brief §5.2 (2.12) | Право на достъп, изтриване, преносимост, корекция; Privacy/GDPR страница, Terms of Use, политики за данни. Силно свързан с EPIC-AUTH-ACCOUNTS и EPIC-ADMIN-PORTAL. |
| **EPIC-CROSS-METRICS** | Метрики и анализи (MVP ниво) | Cross-cutting | **Да (MVP – минимално)** | PRD §4.7 FR-CROSS-3; FR-ADMIN-4 | MVP §5.4, §6.3; Product Brief §5.2 (2.13) | Минимално ниво: агрегирана метрика „брой регистрирани потребители“ в Admin Dashboard. По-сложните метрики са post-MVP. |
| **EPIC-CROSS-SECURITY** | Сигурност и защити (auth, rate limiting, защита от атаки) | Cross-cutting | **Да (MVP)** | PRD §4.2 FR-AUTH-7..8, §4.7 FR-CROSS-4; NFR §5.2, §5.4 | MVP §2.x (CAPTCHA), §6.4; System Architecture NFR | Обхваща базова сигурност: JWT, CSRF/XSS/SQL injection защити, rate limiting (вкл. прост пер-потребител лимит за потвърждения на смяна на email – напр. 3/24h), anti-bot механизми при критични операции (регистрация, forgot/reset, export). |

---

## 3. Post-MVP EPIC-и (MCP разширения)

Тези епици са част от **пълния MCP обхват**, но са изрично отбелязани като **извън първото MVP** в Product Brief / PRD.

| EPIC ID | Име | Област | MVP? | Източник (Product Brief / PRD) | Бележки |
| --- | --- | --- | --- | --- | --- |
| **EPIC-EXAMS** | Тестове и казуси (exams) | Learning / Assessment | **Не (Post-MVP)** | Product Brief §5.1 (2.7) – извън MVP; PRD §4.5 (задачи/оценяване – разширение) | Модул за структурирани изпити/казуси, вероятно стъпващ върху EPIC-PRACTICE-TASKS и Training API. |
| **EPIC-COURSES-AND-PROGRESS** | Курсове и прогрес по курсове | Learning / Courses | **Не (Post-MVP)** | Product Brief §5.1 (2.9, 2.14) – извън MVP | Организиране на съдържание в курсове и проследяване на прогреса на потребителя. Силно интегриран с Wiki, практическа среда и Auth. |
| **EPIC-ADS-MONETIZATION** | Рекламни позиции и монетизация | Monetization | **Не (Post-MVP)** | Product Brief §5.1 (2.10) – извън MVP | Управление на рекламни блокове (локации, формати) по сайта, с оглед UX/етични ограничения. |

---

## 4. Бележки за планирaне и Walking Skeleton-и

 - WS-1 в момента покрива **тесен slice** от `EPIC-WIKI-PUBLIC` + част от `EPIC-WIKI-ADMIN` (DB/model/seed) и `EPIC-CROSS-I18N`.
 - Следващи Walking Skeleton-и / спринтове могат да се фокусират върху:
  - Auth & Accounts (EPIC-AUTH-ACCOUNTS + EPIC-CROSS-SECURITY + EPIC-CROSS-GDPR-LEGAL).
  - Practical Env (UI/Training API + евентуално първи стъпки по EPIC-PRACTICE-TASKS).
  - Admin Portal и Metrics (EPIC-ADMIN-PORTAL + EPIC-CROSS-METRICS).
 - При нужда всеки EPIC от тази карта се детайлизира в отделен `EPIC-XXX-...md` файл с child stories в `docs/backlog/`, по същия шаблон, който вече използваме за WS-1 Wiki.

## 5. FR-WIKI → EPIC → Story traceability

| FR ID | Кратко описание | Свързани EPIC-и | WS-1 EPIC-и / Stories | MVP Stories (извън WS-1) |
| --- | --- | --- | --- | --- |
| **FR-WIKI-1** | Публичен списък със статии (Guest/User, без акаунт) | EPIC-WIKI-PUBLIC | EPIC-WS1-WIKI-BE, EPIC-WS1-WIKI-FE; STORY-WS1-BE-WIKI-LIST-ENDPOINT; STORY-WS1-FE-WIKI-LIST; STORY-WS1-FE-WIKI-STATES; STORY-WS1-BE-WIKI-DB-SEED (поддържа реални данни) | – |
| **FR-WIKI-2** | Търсене по заглавие/ключова дума и филтър по език в списъка | EPIC-WIKI-PUBLIC | – (извън обхвата на WS-1; виж out-of-scope секциите в EPIC-WS1-WIKI-BE/FE) | STORY-MVP-WIKI-SEARCH-FILTER |
| **FR-WIKI-3** | Екран „Wiki статия“ с базово съдържание и действия „Сподели“/„Принтирай“ | EPIC-WIKI-PUBLIC | EPIC-WS1-WIKI-BE, EPIC-WS1-WIKI-FE; STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT; STORY-WS1-FE-WIKI-ARTICLE; STORY-WS1-FE-WIKI-STATES; STORY-WS1-BE-WIKI-DB-SEED (поддържа реални данни) | STORY-MVP-WIKI-ARTICLE-ACTIONS (действия „Сподели“ и „Принтирай“) |
| **FR-WIKI-4** | Превключване на език за Wiki статия и списък | EPIC-WIKI-PUBLIC, EPIC-CROSS-I18N | – (WS-1 може да използва фиксиран език, както е описано в `walking-skeleton.md`) | STORY-MVP-WIKI-LANGUAGE-SWITCH |
| **FR-WIKI-5** | Публичните екрани показват само статии със статус `Active` | EPIC-WIKI-PUBLIC, EPIC-ADMIN-PORTAL | STORY-WS1-BE-WIKI-LIST-ENDPOINT; STORY-WS1-BE-WIKI-ARTICLE-ENDPOINT; STORY-WS1-BE-WIKI-DB-SEED; STORY-WS1-FE-WIKI-LIST; STORY-WS1-FE-WIKI-ARTICLE; STORY-WS1-FE-WIKI-STATES | – (Admin управление на статуса се покрива от бъдещи Admin stories под EPIC-ADMIN-PORTAL) |

> Забележка: Тази таблица обхваща само FR-WIKI частта от PRD. Аналогични traceability таблици могат да бъдат добавени за FR-AUTH, FR-UI-DEMO, FR-API-DEMO и др., когато backlog-ът за тях бъде детайлизиран.
