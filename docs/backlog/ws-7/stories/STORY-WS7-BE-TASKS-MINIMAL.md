# STORY-WS7-BE-TASKS-MINIMAL – Минимални Tasks endpoints (load + submit)

Status: Done

## Summary
Като **потребител/курсист** искам да мога **да зареждам примерни практичeски задачи и да подавам решенията си към тях**, за да получавам базов автоматичен feedback за това дали решението ми е коректно.

## Links to BMAD artifacts
- PRD – `docs/product/prd.md` §4.5 (FR-TASKS-1..3 – дефиниране, подаване и оценяване на задачa).  
- MVP feature list – `docs/architecture/mvp-feature-list.md` (Practical tasks – basic).  
- System Architecture – `docs/architecture/system-architecture.md` ("Tasks service").  
- OpenAPI – `docs/architecture/openapi.yaml` (Tasks endpoints – да се допълнят при нужда).  
- MCP EPIC Map – `docs/backlog/MCP-EPIC-map.md` (EPIC-PRACTICE-TASKS).

## Acceptance Criteria
- Съществуват поне следните Tasks endpoints:
  - `GET /api/tasks/{id}`:
    - връща дефиниция на задача с полета (пример):
      - `id`, `title`, `description`;
      - `type` (поне един базов тип, напр. `string_match`);
      - `inputExample` / `expectedOutputExample` или по-прост schema, подходящ за WS-7;
    - при несъществуваща задача връща `404`.
  - `POST /api/tasks/{id}/submit`:
    - приема JSON body с отговор/решение (напр. `{ "answer": "..." }`);
    - връща JSON payload с полета (пример):
      - `success: boolean`;
      - `score?: number` (по избор);
      - `feedback?: string` – кратко текстово описание на резултата;
    - при невалидно тяло/липсващи полета връща `400`;
    - при несъществуваща задача връща `404`.
- Има дефинирани поне **1–2 примерни задачи** (seed/fixture данни), които могат да бъдат заредени с `GET /api/tasks/{id}`.
- Оценяването (evaluation) за WS-7 може да бъде опростено (например exact string match), но трябва да бъде **детерминистично** и да не зависи от външни системи.
- Tasks endpoints не изискват задължително аутентикация за WS-7 (или използват много опростен режим, според PRD), но са проектирани така, че в бъдеще да поддържат асоцииране на решения с конкретни потребители.
- Endpoint-ите са описани в `openapi.yaml` с коректни request/response схеми.

## Dev Tasks
- [x] Дизайн на минимален "Tasks" модул (entities/DTOs/service/controller) за WS-7.
- [x] Имплементация на `GET /api/tasks/{id}` за зареждане на дефиниция на задача (от in-memory колекция, seed таблица или конфигурационни файлове).
- [x] Имплементация на `POST /api/tasks/{id}/submit` с опростен evaluation pipeline (напр. string compare за отговор).
- [x] Добавяне на 1–2 примерни задачи в seed/fixture данни.
- [x] Обновяване на `openapi.yaml` с Tasks endpoints и payload-и.
- [x] Unit тестове за evaluation логиката и service слоя (успешно/грешно решение, липсваща задача).
- [x] E2E тестове за Tasks endpoints (load + submit + basic error cases).

## Notes
- За WS-7 **не е необходимо** сложен scoring/leaderboard – целта е да има реален, но опростен flow за зареждане и оценяване на задача.
- В бъдещи WS/epics (EPIC-EXAMS, разширен EPIC-PRACTICE-TASKS) този модул може да се разшири с повече типове задачи, време за изпълнение, точки, изпити и др.
