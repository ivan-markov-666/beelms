# EPIC-WS7-PRACTICE-ENV-TASKS – Practical Environment (UI, Training API, Tasks)

Status: Planned

## Summary
Този epic дефинира WS-7 walking skeleton за **Практическа среда (Practical Env)**: минимален, но реален vertical, в който потребителят може:
- да отвори примерна **Practice UI** страница с богати UI елементи за упражнения;
- да използва **Training API** (ping/echo) за базови API/integration упражнения;
- да зареди примерна задача (task) и да подаде решение, което да бъде оценено на ниво „успех/неуспех“ (дори и с опростен evaluator).

## Scope (какво покрива този epic)
- **Training API (BE)**
  - Публичен, но ограничен Training API с поне:
    - `GET /api/training/ping` – здравен/демо endpoint;
    - `POST /api/training/echo` – връща обратно подадените данни, използван за API упражнения.
- **Tasks API (BE)**
  - Минимални endpoints за работа със задачи:
    - `GET /api/tasks/{id}` – зарежда дефиниция на примерна задача (описание, вход, очакван изход/правила);
    - `POST /api/tasks/{id}/submit` – приема решение и връща резултат (успех/score/feedback) – дори и с опростена логика за WS-7.
- **Practice UI (FE)**
  - Страница (напр. `/practice/ui-demo`), която:
    - показва богат набор от UI елементи (форми, бутони, таблици и др.) за manual/UI automation упражнения;
    - може да ползва Tasks API за зареждане на примерна UI задача.
- **Practice API Demo (FE)**
  - Страница (напр. `/practice/api-demo`), която:
    - обяснява накратко Training API (ping/echo);
    - показва примерни заявки (curl/код) и/или позволява да се изпратят тестови заявки директно от UI;
    - по възможност предоставя линк към Swagger UI / OpenAPI описанието.

Out of scope за този epic (за бъдещи WS/epics):
- Пълен модул за задачи/оценяване с множество типове задачи, scoreboard, прогрес, exams.
- Сложни evaluation engines и sandbox изпълнение на произволен код.
- Разширени UI сценарии с drag&drop, canvas и др. – за WS-7 целта е минимален, но реален set от компоненти.

## Related BMAD artifacts
- Product Brief – `docs/product/product-brief.md` (секция за Practical Env / Training).  
- PRD – `docs/product/prd.md` (§4.3 FR-UI-DEMO-1..3, §4.4 FR-API-DEMO-1..3, §4.5 FR-TASKS-1..3).
- MVP Feature List – `docs/architecture/mvp-feature-list.md` (§3 – UI demo, §4 – Training API & Tasks).
- System Architecture – `docs/architecture/system-architecture.md` (компоненти „Training API“, "Tasks service", "Practice UI").
- OpenAPI – `docs/architecture/openapi.yaml` (Training API, Tasks endpoints – да се синхронизират при нужда).
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-PRACTICE-UI-DEMO, EPIC-PRACTICE-API-DEMO, EPIC-PRACTICE-TASKS).

## Child user stories
- [x] STORY-WS7-BE-TRAINING-API-MINIMAL – Минимален Training API (ping/echo) за API упражнения.
- [ ] STORY-WS7-BE-TASKS-MINIMAL – Минимални Tasks endpoints за зареждане и submit на задача.
- [ ] STORY-WS7-FE-PRACTICE-UI-PAGE – Practice UI страница за manual/UI automation упражнения.
- [ ] STORY-WS7-FE-PRACTICE-API-DEMO-PAGE – Practice API demo страница, която стъпва върху Training API.

## Risks / Assumptions
- **Risks:**
  - Сложен evaluator или твърде голям обхват на Tasks може да претовари WS-7 и да забави delivery.
  - Public Training API без ограничения може да бъде злоупотребен (необходимо е поне базово rate limiting / защита).
- **Assumptions:**
  - За WS-7 е достатъчно опростено оценяване на задачите (примерно string compare, exact match).
  - Основната цел е учебна/демо среда, не production-grade judge система.

## Definition of Done (Epic)
- Всички child stories по-горе са имплементирани и затворени.
- Потребител може:
  - да отвори Practice UI страница и да използва UI елементите според описанието на задачата;
  - да зареди поне една примерна задача чрез Tasks API и да види нейното описание в UI;
  - да използва Training API (ping/echo) чрез FE или външен клиент за базови API упражнения;
  - да подаде решение към поне една Task и да получи смислен резултат (успех/грешка, базов feedback).
- Training API и Tasks endpoints са описани и синхронизирани с `openapi.yaml`.
- Има поне базови BE и FE тестове за основните сценарии (Training API ping/echo, load/submit task, Practice UI / API demo страници).
- Няма отворени P0/P1 дефекти за WS-7 Practical Env vertical-а.
