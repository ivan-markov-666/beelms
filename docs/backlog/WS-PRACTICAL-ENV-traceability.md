# Practical Environment – FR-UI-DEMO / FR-API-DEMO / FR-TASKS Traceability Matrix

_Роля: Analyst / Tech Lead. Цел: да свърже PRD §4.4–4.5 (Практическа среда – UI/API/TASKS) с наличните и планирани епици и stories._

## 1. Обхват

- Фокус: практическа среда (Sandbox UI + Training API + Tasks), описана в:
  - PRD – `docs/product/prd.md` (§4.4 FR-UI-DEMO, §4.5 FR-API-DEMO, §4.5 FR-TASKS).
  - MVP Feature List – `docs/architecture/mvp-feature-list.md` (§3, §4).
  - System Architecture – `docs/architecture/system-architecture.md` (Практическа среда, Training API, Tasks).
- Към момента **walking skeleton-и WS-3+ и свързани backlog items за Practical Env тепърва ще се добавят** според приоритета на екипа.

## 2. Traceability таблица (FR-UI-DEMO / FR-API-DEMO / FR-TASKS ↔ Epics ↔ Stories)

> Забележка: Стойности `TBD` означават, че конкретен epic/story все още не е дефиниран в `docs/backlog` и трябва да бъде създаден при стартиране на съответния walking skeleton (напр. WS-3 Sandbox UI skeleton).

| FR ID        | Кратко описание (PRD)                                                                      | Планирани/свързани епици (MCP-EPIC-map) | Налични WS/Stories в `docs/backlog`                             | Статус |
|-------------|--------------------------------------------------------------------------------------------|------------------------------------------|------------------------------------------------------------------|--------|
| FR-UI-DEMO-1 (FR-UI-DEMO) | UI demo страници с богата комбинация от HTML елементи, reset, примерни задачи                        | EPIC-PRACTICAL-UI (TBD, виж MCP-EPIC-map) | Няма дефинирани WS/Stories към момента                           | TBD – да се дефинира WS-3 „Sandbox UI skeleton“ с BE/FE stories. |
| FR-API-DEMO-1 (FR-API-DEMO) | Training API с Swagger/OpenAPI, базови ping/echo endpoints за API/integration упражнения           | EPIC-TRAINING-API (TBD)                 | Няма дефинирани WS/Stories към момента                           | TBD – да се дефинират epics/stories за Training API (BE/FE/DevOps). |
| FR-TASKS-1..3 (FR-TASKS)  | Зареждане на задача, изпращане на решение, автоматично оценяване и връщане на резултат               | EPIC-TASKS-ENGINE (post-MVP, TBD)       | Няма дефинирани WS/Stories към момента                           | Post-MVP – да се дефинират отделни epics/stories, когато Practical Env бъде приоритизиран за реализация. |

## 3. Препоръки за следващи стъпки

1. **При стартиране на WS-3 (Sandbox UI skeleton):**
   - Да се създаде `ws-3/` под `docs/backlog/` с epics/stories, които конкретно реализират FR-UI-DEMO (UI demo екраните) и част от FR-API-DEMO (линк към Training API екран).
   - Да се обнови тази матрица с реалните epic/story идентификатори.
2. **При стартиране на Training API vertical:**
   - Да се дефинират BE/FE epics и stories за Training API (Swagger UI, ping/echo endpoints) и да се свържат към FR-API-DEMO.
3. **При преминаване към post-MVP Tasks Engine:**
   - Да се добавят epics/stories за Task/TaskResult (в синхрон с `db-model.md`) и да се попълни колоната „Налични WS/Stories“ за FR-TASKS-1..3.
