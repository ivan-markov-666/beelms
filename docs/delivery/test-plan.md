# beelms core – Test Plan (Delivery)

_Роля: QA Lead / Tech Lead. Фаза: BMAD Delivery._

## 1. Цел
 
Този документ дефинира **тестовите цикли**, **средите**, **test suites** и **release gates** за beelms core MVP.
Той стъпва на:

- `docs/testing/beelms-core-test-design.md` (стратегия/нива/рискове)
- `docs/delivery/walking-skeleton.md` (WS-1..WS-4 вертикали)
- `docs/architecture/mvp-bmad-dod-checklist.md` (MVP DoD gate)

Целта е да има ясен отговор на:

- какво се тества **при всяка промяна**;
- какво се тества **преди release**;
- какво се тества **след deploy**.

## 2. Нива на тестване (MVP)

- Unit tests (BE/FE)
- API / Integration tests
- E2E / UI smoke (Playwright)

## 3. Тестови среди

- **Local dev:** локални BE/FE процеси + локална DB или Dockerized DB.
- **CI-like local run (poor-man CI):** `docs/ops/local-ci.md` (ръчен ритуал преди push/release).
- **Staging (препоръчително):** среда максимално близка до production (Docker Compose), отделна DB и отделни env.
- **Production:** реален deploy.

Правило: smoke suite трябва да минава еднакво добре на staging и production.

## 4. Test suites

- **Smoke suite:** минимален набор за валидиране на deployment.
- **Regression suite:** основни позитивни/негативни потоци по Auth/Wiki/Courses/Assessments/Admin.

### 4.1. Smoke suite (deployment validation)

Минимален набор за валидиране, че системата е жива и WS вертикалите са „проходими“.

- **WS-1 (Wiki):** `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`
- **WS-2 (Auth):** `docs/sprint-artifacts/WS2-auth-demo-checklist.md`
- **WS-3 (Courses & Assessments):** `docs/sprint-artifacts/WS3-courses-assessments-demo-checklist.md`
- **WS-4 (Admin):** (когато бъде дефиниран/добавен чеклист към sprint-artifacts)

### 4.2. Regression suite (MVP)

По-пълен набор от тестове (API + E2E), който покрива:

- позитивни и негативни сценарии по всички MVP EPIC-и;
- основни security/regression проверки (JWT guard, admin guard, rate-limit smoke);
- стабилност на данните (refresh/reload сценарии).

Regression suite се изпълнява минимум преди release candidate.

### 4.3. Non-functional smoke (MVP)

Минимални проверки (без тежки load тестове):

- basic security smoke (OWASP Top 10 на „разумно“ ниво за MVP);
- базова стабилност на Lean Tier 0 стек (няколко паралелни потребители в ключови пътеки).

## 5. Traceability (WS ↔ EPIC ↔ suites)

- **WS-1:** EPIC-CORE-WIKI-CONTENT → smoke + regression
- **WS-2:** EPIC-CORE-AUTH-ACCOUNTS, EPIC-CORE-CROSS-GDPR-LEGAL → smoke + regression
- **WS-3:** EPIC-CORE-COURSES-PROGRESS, EPIC-CORE-TASKS, EPIC-CORE-ASSESSMENTS → smoke + regression
- **WS-4:** EPIC-CORE-ADMIN, FR-CROSS (Metrics минимум) → smoke + regression

Източник за EPIC/WS mapping: `docs/backlog/beelms-core-epics-and-stories.md` и `docs/delivery/walking-skeleton.md`.

## 6. Тестови цикли (кога какво пускаме)

### 6.1. При всяка промяна (локално / PR)

- Unit tests (BE/FE)
- API/integration tests (където има)
- Мини smoke subset (ако има бърз Playwright smoke)

### 6.2. Nightly / периодично

- Пълен regression suite (API + E2E)
- Non-functional smoke

### 6.3. Release candidate

- Smoke suite на staging
- Regression suite на staging

## 7. Entry / Exit критерии

- **Entry:** migrations + seed успешни; основните услуги стартират.
- **Exit:** DoD критерии от `docs/architecture/mvp-bmad-dod-checklist.md`.

## 8. Release gates (минимум за MVP)

- **Gate 1 (pre-merge):** unit + lint + основни API тестове (където има)
- **Gate 2 (pre-release):** smoke + regression на staging
- **Gate 3 (post-deploy):** smoke suite на production + визуална проверка на критичните пътеки
