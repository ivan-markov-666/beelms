# Practical Environment – FR-UI-DEMO / FR-API-DEMO / FR-TASKS Traceability Matrix

_Роля: Analyst / Tech Lead. Цел: да свърже PRD §4.4–4.5 (Практическа среда – UI/API/TASKS) с наличните и планирани епици и stories._

## 1. Обхват

- Фокус: практическа среда (Sandbox UI + Training API + Tasks), описана в:
  - PRD – `docs/product/prd.md` (§4.4–4.5 FR-UI-DEMO, FR-API-DEMO, FR-TASKS).
  - MVP Feature List – `docs/architecture/mvp-feature-list.md` (§3, §4).
  - System Architecture – `docs/architecture/system-architecture.md` (Практическа среда, Training API, Tasks).
- Към момента първият WS-3 walking skeleton за Practical Env (UI Demo + Training API) е дефиниран в `docs/backlog/ws-3/` (epics/stories), а матрицата по-долу е синхронизирана с него.

## 2. Traceability таблица (FR-UI-DEMO / FR-API-DEMO / FR-TASKS ↔ Epics ↔ Stories)

> Забележка: Стойности `TBD` означават, че конкретен epic/story все още не е дефиниран в `docs/backlog` и трябва да бъде създаден при стартиране на съответния walking skeleton (напр. WS-3 Sandbox UI skeleton).

| FR ID        | Кратко описание (PRD)                                                                      | Планирани/свързани епици (MCP-EPIC-map) | Налични WS/Stories в `docs/backlog`                             | Статус |
|-------------|--------------------------------------------------------------------------------------------|------------------------------------------|------------------------------------------------------------------|--------|
| FR-UI-DEMO-1 (FR-UI-DEMO) | UI demo страници с богата комбинация от HTML елементи, reset, примерни задачи                        | EPIC-PRACTICE-UI-DEMO; EPIC-WS3-PRACTICAL-UI-DEMO | EPIC-WS3-PRACTICAL-UI-DEMO; STORY-WS3-FE-UI-DEMO-PAGE; STORY-WS3-FE-UI-DEMO-TASKS | WS-3 Sandbox UI skeleton – планиран (epic + FE stories дефинирани, предстои имплементация). |
| FR-API-DEMO-1 (FR-API-DEMO) | Training API с Swagger/OpenAPI, базови ping/echo endpoints за API/integration упражнения           | EPIC-PRACTICE-API-DEMO; EPIC-WS3-PRACTICAL-API-DEMO | EPIC-WS3-PRACTICAL-API-DEMO; STORY-WS3-BE-TRAINING-API-MINIMAL; STORY-WS3-BE-TRAINING-API-SWAGGER; STORY-WS3-FE-TRAINING-API-INTRO | WS-3 Training API skeleton – имплементиран (epic + BE/FE stories реализирани в WS-3). |
| FR-TASKS-1..3 (FR-TASKS)  | Зареждане на задача, изпращане на решение, автоматично оценяване и връщане на резултат               | EPIC-TASKS-ENGINE (post-MVP, TBD)       | Няма дефинирани WS/Stories към момента                           | Post-MVP – да се дефинират отделни epics/stories, когато Practical Env бъде приоритизиран за реализация. |

## 3. Препоръки за следващи стъпки

1. **WS-3 (Sandbox UI + Training API skeleton):**
   - `ws-3/` под `docs/backlog/` вече съдържа epics/stories, които конкретно реализират FR-UI-DEMO (UI demo екраните) и FR-API-DEMO (Training API ping/echo + Swagger).
   - При промени по WS-3 Practical Env да се поддържа тази матрица в синхрон (epic/story идентификатори и статус за FR-UI-DEMO и FR-API-DEMO).
2. **Training API vertical (над минималния WS-3 skeleton):**
   - При разширяване на Training API отвъд ping/echo (CRUD ресурси, Tasks интеграция) да се дефинират допълнителни epics/stories и да се свържат към FR-API-DEMO в тази матрица.
3. **При преминаване към post-MVP Tasks Engine:**
   - Да се добавят epics/stories за Task/TaskResult (в синхрон с `db-model.md`) и да се попълни колоната „Налични WS/Stories“ за FR-TASKS-1..3.
